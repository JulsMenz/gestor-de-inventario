# Tiendas de Barrio — Gestión de Inventario y Catálogo

Aplicación web para que comerciantes locales (*tenderos*) publiquen su catálogo de productos y reciban pedidos de clientes. Proyecto académico — Universidad de la Costa (CUC).

---

## 1. Arquitectura

### Backend — Vertical Slice Architecture (VSA) con separación Comando/Consulta

El backend sigue **VSA (Vertical Slice Architecture)**: el código se organiza por *feature* (funcionalidad) y no por capa técnica. Cada feature es un módulo autónomo que contiene su propia lógica, validaciones y acceso a datos.

Dentro de cada feature, las operaciones siguen una separación inspirada en **CQRS**:

| Tipo | Qué hace | Ejemplo |
|------|----------|---------|
| **Command** | Muta estado (crear, editar, eliminar) | `crear/handler.ts`, `editar/handler.ts` |
| **Query** | Lee sin mutar | `listar/handler.ts`, `obtener/handler.ts` |

```
Backend/src/
├── index.ts                    ← Punto de entrada, monta Features + static
├── shared/
│   ├── index.ts                ← Re-exporta conexion + todas las tablas
│   └── database/
│       ├── conexion.ts         ← Pool PostgreSQL con Drizzle ORM
│       └── schema/
│           ├── usuarios.ts
│           ├── productos.ts
│           ├── categorias.ts
│           ├── pedidos.ts
│           └── detallePedido.ts
└── features/
    ├── index.ts                ← Router raíz: prefix /api
    ├── auth/
    │   ├── registro/handler.ts
    │   └── login/handler.ts
    ├── categorias/
    │   ├── crear/handler.ts
    │   ├── editar/handler.ts
    │   ├── eliminar/handler.ts
    │   └── listar/handler.ts
    ├── productos/
    │   ├── crear/handler.ts
    │   ├── editar/handler.ts
    │   ├── eliminar/handler.ts
    │   ├── listar/handler.ts
    │   └── obtener/handler.ts
    ├── pedidos/
    │   ├── crear/handler.ts
    │   ├── listar/handler.ts
    │   └── actualizar/handler.ts
    └── tiendas/
        ├── listar/handler.ts
        └── obtener/handler.ts
```

### Frontend — SvelteKit SPA estática

El frontend es una **Single Page Application** generada con `adapter-static`. Se sirve directamente desde el backend en producción (misma URL, sin CORS). La navegación es 100 % del lado del cliente; el servidor sirve `404.html` como shell SPA para cualquier ruta no reconocida.

```
Frontend/src/
├── lib/
│   ├── api/client.ts           ← Capa HTTP: fetch + token auth
│   ├── stores/
│   │   ├── auth.ts             ← Estado global de sesión (localStorage)
│   │   └── carrito.ts          ← Carrito reactivo con totales derivados
│   └── types.ts                ← Interfaces TypeScript compartidas
└── routes/
    ├── +layout.svelte          ← Navbar + drawer carrito
    ├── +page.svelte            ← / Listado de tiendas
    ├── [slug]/+page.svelte     ← /[slug] Catálogo de tienda
    ├── login/+page.svelte
    ├── registro/+page.svelte
    ├── checkout/+page.svelte
    ├── pedido-confirmado/+page.svelte
    └── admin/
        ├── pedidos/+page.svelte
        ├── productos/+page.svelte
        └── categorias/+page.svelte
```

---

## 2. Features

### Auth
Registro e inicio de sesión con JWT. Los usuarios pueden ser `tendero` o `cliente`. Al registrarse como tendero se requiere un nombre de tienda; el sistema genera automáticamente un `slug` único (ej. `"Tienda de Don Juan"` → `tienda-de-don-juan`) que se usa como URL pública.

### Tiendas
Listado público de todos los tenderos registrados. Cada tienda tiene su propia página en `/{slug}` con su catálogo filtrable por nombre y categoría.

### Categorías
Cada tendero gestiona sus propias categorías. Las operaciones de escritura requieren JWT y verifican que la categoría pertenezca al tendero autenticado (ownership check). Las categorías se filtran por `tenderoId` en los endpoints públicos.

### Productos
Los tenderos crean y administran su inventario. El `tenderoId` se asigna automáticamente desde el JWT al crear. Las consultas públicas filtran por tienda. Soporta búsqueda por nombre, filtro por categoría y filtro por tendero.

### Pedidos
Los clientes (autenticados o como invitado) crean pedidos desde el carrito. Si el carrito tiene productos de múltiples tiendas, se genera **un pedido por tienda** dentro de una única transacción, reduciendo el stock de cada producto de forma atómica. Los tenderos pueden cambiar el estado (`pendiente → confirmado → entregado / cancelado`). Al cancelar, el stock se restaura automáticamente en otra transacción.

---

## 3. Cómo se construye un endpoint

Cada handler es una instancia de `Elysia` que se monta en el router de su feature con `.use()`. Elysia valida el body/query/params en tiempo de compilación y en runtime usando su sistema de tipos con `t` (TypeBox).

**Ejemplo — `POST /api/pedidos/`:**

```typescript
// 1. Importar Elysia, validadores y dependencias
import { Elysia, t } from 'elysia';
import { jwt } from '@elysia/jwt';
import { database } from '../../../shared';

const { conexion, productos, pedidos, detallePedido } = database;

// 2. Crear instancia del handler
export const crear = new Elysia()
  // 3. Registrar plugins (JWT se inyecta como dependencia)
  .use(jwt({ name: 'jwt', secret: JWT_SECRET }))

  // 4. Definir la ruta con su handler async
  .post('/', async ({ body, headers, jwt, status }) => {

    // 5. Auth opcional: leer token del header Authorization: Bearer <token>
    const token = headers['authorization']?.slice(7);
    const payload = token ? await jwt.verify(token) : null;

    // 6. Lógica de negocio
    // ...validar stock, agrupar items por tenderoId...

    // 7. Transacción atómica: crea un pedido por tienda y reduce stock
    await conexion.transaction(async (tx) => {
      // ...insert pedido, insert detalle_pedido, update productos.cantidad...
    });

    // 8. Respuesta tipada con código HTTP explícito
    return status(201, pedidosCreados);

  }, {
    // 9. Esquema de validación del body (TypeBox — validado en runtime)
    body: t.Object({
      items: t.Array(t.Object({
        productoId: t.Integer(),
        cantidad: t.Integer({ minimum: 1 }),
      }), { minItems: 1 }),
    }),
  });
```

El router de la feature monta el handler con un prefijo:

```typescript
// features/pedidos/index.ts
export const pedidosFeature = new Elysia({ prefix: '/pedidos' })
  .use(crear)      // POST   /api/pedidos/
  .use(listar)     // GET    /api/pedidos/
  .use(actualizar); // PATCH /api/pedidos/:id
```

Y el router raíz agrega `/api`:

```typescript
// features/index.ts
export const Features = new Elysia({ prefix: '/api' })
  .use(pedidosFeature); // → /api/pedidos/
```

### Tabla de endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/registro` | No | Crear cuenta (tendero o cliente) |
| POST | `/api/auth/login` | No | Iniciar sesión, devuelve JWT |
| GET | `/api/tiendas/` | No | Listar todas las tiendas |
| GET | `/api/tiendas/:slug` | No | Datos de tienda + productos filtrados |
| GET | `/api/categorias/` | No | Listar categorías (`?tenderoId=`) |
| POST | `/api/categorias/` | Tendero | Crear categoría |
| PATCH | `/api/categorias/:id` | Tendero (owner) | Editar categoría |
| DELETE | `/api/categorias/:id` | Tendero (owner) | Eliminar categoría |
| GET | `/api/productos/` | No | Listar productos (`?tenderoId=`, `?buscar=`, `?categoriaId=`) |
| GET | `/api/productos/:id` | No | Obtener producto por ID |
| POST | `/api/productos/` | Tendero | Crear producto (tenderoId auto) |
| PATCH | `/api/productos/:id` | Tendero | Editar producto |
| DELETE | `/api/productos/:id` | Tendero | Eliminar producto |
| GET | `/api/pedidos/` | Tendero | Listar pedidos propios |
| POST | `/api/pedidos/` | Opcional | Crear pedido (1 por tienda) |
| PATCH | `/api/pedidos/:id` | Tendero (owner) | Cambiar estado del pedido |

---

## 4. Librerías y tecnologías

### Backend

| Tecnología | Versión | Rol |
|------------|---------|-----|
| **Bun** | ≥ 1.x | Runtime + package manager + compilador a binario |
| **Elysia** | latest | Framework HTTP (inspirado en Hono, optimizado para Bun) |
| **@elysia/jwt** | ^1.4 | Middleware JWT (firma y verificación con HS256) |
| **@elysia/cors** | ^1.4 | Middleware CORS |
| **@elysia/static** | ^1.4 | Servidor de archivos estáticos (sirve el SPA en producción) |
| **Drizzle ORM** | ^0.45 | ORM type-safe con migraciones via `drizzle-kit` |
| **pg** | ^8.21 | Driver PostgreSQL para Node/Bun |
| **PostgreSQL** | 15 | Base de datos relacional (desplegada en **Aiven Cloud**) |

#### Seguridad
- Contraseñas: `Bun.password.hash()` / `Bun.password.verify()` — bcrypt nativo de Bun, sin dependencias externas.
- JWT: `@elysia/jwt` con secreto configurable via `JWT_SECRET` en variables de entorno.
- Conexión SSL a Aiven: se elimina `sslmode` de la URL de conexión y se aplica la configuración SSL programáticamente con soporte para certificado CA (`ca.pem`).

### Frontend

| Tecnología | Versión | Rol |
|------------|---------|-----|
| **SvelteKit** | ^2.57 | Framework SSG/SPA con enrutamiento basado en archivos |
| **Svelte 5** | ^5.55 | UI reactiva con Runes (`$state`, `$derived`, `$effect`) |
| **Vite** | ^8 | Build tool y dev server |
| **Tailwind CSS** | ^4 | Estilos utilitarios |
| **DaisyUI** | ^5 | Componentes UI sobre Tailwind (tema: `lemonade`) |
| **adapter-static** | ^3 | Genera SPA estática con `fallback: '404.html'` |

### Base de datos — Aiven PostgreSQL

PostgreSQL gestionado en la nube por Aiven. La conexión usa SSL con `rejectUnauthorized: false` por defecto, o verificación completa si se provee `ca.pem` en la raíz del backend.

---

## 5. Modelo de datos

```mermaid
erDiagram
    usuarios {
        serial id PK
        text nombre
        text email UK
        text password
        text tipo "tendero | cliente"
        text nombre_tienda
        text slug_tienda UK
        timestamp creado_en
    }

    categorias {
        serial id PK
        text nombre
        text descripcion
        integer tendero_id FK
        timestamp creado_en
    }

    productos {
        serial id PK
        text nombre
        text descripcion
        float precio
        integer cantidad
        integer categoria_id FK
        integer tendero_id FK
        boolean activo
        timestamp creado_en
        timestamp actualizado_en
    }

    pedidos {
        serial id PK
        integer cliente_id FK
        integer tendero_id FK
        text nombre_contacto
        text telefono_contacto
        text estado "pendiente|confirmado|entregado|cancelado"
        float total
        timestamp creado_en
        timestamp actualizado_en
    }

    detalle_pedido {
        serial id PK
        integer pedido_id FK
        integer producto_id FK
        integer cantidad
        float precio_unitario
        float subtotal
    }

    usuarios ||--o{ categorias : "tendero crea"
    usuarios ||--o{ productos : "tendero publica"
    usuarios ||--o{ pedidos : "tendero recibe"
    usuarios ||--o{ pedidos : "cliente genera"
    pedidos ||--o{ detalle_pedido : "contiene"
    productos ||--o{ detalle_pedido : "referenciado en"
    categorias ||--o{ productos : "clasifica"
```

---

## 6. Diagramas de arquitectura

### Desarrollo local

```mermaid
graph TD
    DEV["Desarrollador"]

    subgraph "Maquina local"
        subgraph "Frontend — localhost:5173"
            VITE["Vite Dev Server\nbun run dev"]
            SVELTE["SvelteKit + Svelte 5\nHot Module Reload"]
        end

        subgraph "Backend — localhost:8000"
            ELYSIA["Elysia HTTP Server\nbun run dev"]
            DRIZZLE["Drizzle ORM"]
        end
    end

    subgraph "Aiven Cloud"
        PG[("PostgreSQL 15")]
    end

    DEV --> VITE
    SVELTE -->|"fetch /api/*\nBASE_URL = localhost:8000"| ELYSIA
    ELYSIA --> DRIZZLE
    DRIZZLE -->|"SSL TCP"| PG
```

### Producción (Docker + Koyeb)

```mermaid
graph TD
    USER["Usuario / Browser"]

    subgraph "Koyeb — Contenedor Docker"
        subgraph "Proceso unico :8000"
            BIN["Binario compilado\nbun build --compile"]
            STATIC["@elysia/static\npublic/ SvelteKit build"]
            API["Elysia /api/*\nFeatures router"]
            FALLBACK["Wildcard *\npublic/404.html SPA shell"]
        end
    end

    subgraph "Aiven Cloud"
        PG[("PostgreSQL 15")]
    end

    USER -->|"HTTPS"| BIN
    BIN --> STATIC
    BIN --> API
    BIN --> FALLBACK
    API -->|"SSL TCP"| PG
```

### Pipeline de build (Dockerfile multi-stage)

```mermaid
graph LR
    subgraph "Stage 1: frontend-build"
        F1["bun install"] --> F2["bun run build"]
        F2 --> F3["Frontend/build/"]
    end

    subgraph "Stage 2: backend-build"
        B1["bun install"] --> B2["COPY build/ a public/"]
        F3 --> B2
        B2 --> B3["bun build --compile\n./server"]
    end

    subgraph "Stage 3: distroless"
        B3 --> D1["COPY server"]
        B2 --> D2["COPY public/"]
        D1 & D2 --> D3["CMD ./server :8000"]
    end
```

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión PostgreSQL (Aiven) | `postgresql://user:pass@host:port/db?sslmode=require` |
| `JWT_SECRET` | Secreto para firmar tokens JWT | `mi-secreto-seguro-2024` |

El archivo `ca.pem` (certificado CA de Aiven) se coloca en la raíz del backend para habilitar verificación SSL completa. Si no existe, la conexión usa `rejectUnauthorized: false`.
