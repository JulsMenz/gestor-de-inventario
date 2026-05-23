import { defineConfig } from 'drizzle-kit';

const db_url = process.env.DATABASE_URL || 'valor_por_defecto';

export default defineConfig({
	out: './drizzle',
	schema: './src/shared/database/schema',
	dialect: 'postgresql',
	dbCredentials: {
		url: db_url
	}
});
