import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import path from "path";
import dotenvSafe from 'dotenv-safe';

if (process.env.NODE_ENV !== 'production') {
  dotenvSafe.config({
    allowEmptyValues: false,
    example: path.resolve(process.cwd(), '.env.example'),
    path: path.resolve(process.cwd(), '.env.local')
  });
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }  // enforce valid SSL cert
    : false,
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
