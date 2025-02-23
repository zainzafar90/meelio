import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { config } from '../config/config';
import * as schema from './schema';

if (!process.env.DB_URL) {
  throw new Error('DB_URL is not set');
}

const pool = new Pool({
  connectionString: config.db.url,
});

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });
