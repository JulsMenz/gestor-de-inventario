import { conexion } from "./database/conexion";
import { categorias } from "./database/schema/categorias";
import { productos } from "./database/schema/productos";
import { usuarios } from "./database/schema/usuarios";
import { pedidos } from "./database/schema/pedidos";
import { detallePedido } from "./database/schema/detallePedido";

export const database = { conexion, categorias, productos, usuarios, pedidos, detallePedido };
