import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// Quitar sslmode de la URL para que no conflictúe con nuestra config ssl
const rawUrl = new URL(process.env.DATABASE_URL!);
rawUrl.searchParams.delete('sslmode');
rawUrl.searchParams.delete('ssl');

const caPath = resolve(process.cwd(), 'ca.pem');
const ssl = existsSync(caPath)
	? { ca: readFileSync(caPath, 'utf-8'), rejectUnauthorized: true }
	: { rejectUnauthorized: false };

const pool = new Pool({
	connectionString: rawUrl.toString(),
	ssl,
});

export const conexion = drizzle(pool);
