import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config'; // loads from .env or .env.local usually, but let's be explicit
import * as dotenv from 'dotenv';

// Try to load .env.local first
dotenv.config({ path: '.env.local' });

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL is not set in your environment variables.');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to the database...');
    await client.connect();

    const sqlFilePath = path.join(process.cwd(), 'migrations', '20260811_create_programas_ensino.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('🚀 Running migration: migrations/20260811_create_programas_ensino.sql...');
    
    // Execute the SQL
    await client.query(sql);

    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:');
    console.error(err);
  } finally {
    await client.end();
  }
}

runMigration();
