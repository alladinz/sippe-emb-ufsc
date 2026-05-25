import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import path from "path";

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dotenvSafe = require('dotenv-safe');
  dotenvSafe.config({
    allowEmptyValues: false,
    example: path.resolve(process.cwd(), '.env.example'),
    path: path.resolve(process.cwd(), '.env.local')
  });
}

if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.error("DATABASE_URL is not defined in production environment");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? true : false,
  max: 20,           // max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err);
  // Do NOT crash the server on pool error
});

export const db = drizzle(pool, { schema });
