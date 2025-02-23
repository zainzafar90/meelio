import 'dotenv/config';

import { defineConfig } from 'drizzle-kit';

if (!process.env.DB_URL) {
  throw new Error('DATABASE_URL is not set');
}

export default defineConfig({
  out: './src/db/drizzle',
  schema: './src/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DB_URL,
  },
});
