CREATE TABLE IF NOT EXISTS programas_ensino (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'archived')),
  criado_por TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  atualizado_por TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  
  codigo_disciplina VARCHAR(20),
  nome_disciplina VARCHAR(255),
  cursos_vinculados TEXT[],
  
  carga_horaria_teorica INTEGER DEFAULT 0,
  carga_horaria_pratica INTEGER DEFAULT 0,
  carga_horaria_total INTEGER DEFAULT 0,
  creditos_teoricos INTEGER DEFAULT 0,
  creditos_praticos INTEGER DEFAULT 0,
  
  ementa TEXT,
  objetivos TEXT,
  conteudo_programatico TEXT,
  criterios_avaliacao TEXT,
  
  bibliografia JSONB DEFAULT '[]'::jsonb,
  
  curso_aprovacao VARCHAR(255),
  aprovado_por TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  feedback_aprovacao TEXT,
  
  submetido_em TIMESTAMP,
  aprovado_em TIMESTAMP,
  arquivado_em TIMESTAMP,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_programas_ensino_disciplina_status 
  ON programas_ensino(disciplina_id) 
  WHERE status NOT IN ('archived', 'rejected');

CREATE INDEX IF NOT EXISTS idx_programas_ensino_status ON programas_ensino(status);
CREATE INDEX IF NOT EXISTS idx_programas_ensino_criado_por ON programas_ensino(criado_por);

CREATE TABLE IF NOT EXISTS historico_programas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programa_id UUID NOT NULL REFERENCES programas_ensino(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  tipo_evento VARCHAR(50) NOT NULL,
  descricao TEXT,
  snapshot JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historico_programas_programa ON historico_programas(programa_id);

CREATE OR REPLACE FUNCTION update_programa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_programas_updated_at
  BEFORE UPDATE ON programas_ensino
  FOR EACH ROW EXECUTE FUNCTION update_programa_updated_at();
