import { db } from "./src/db/index.js";
import { sql } from "drizzle-orm";

async function run() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS programa_aprovacoes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        programa_id UUID NOT NULL REFERENCES programas_ensino(id) ON DELETE CASCADE,
        curso VARCHAR(255) NOT NULL,
        coordenador_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        feedback TEXT,
        decided_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_programa_aprovacoes_programa_curso ON programa_aprovacoes(programa_id, curso);
      CREATE INDEX IF NOT EXISTS idx_programa_aprovacoes_programa ON programa_aprovacoes(programa_id);
    `);
    console.log("Migration successful");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
