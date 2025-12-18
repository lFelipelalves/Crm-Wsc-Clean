-- Tabela de Listas de Cobrança
CREATE TABLE IF NOT EXISTS listas_cobranca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'COBRANCA_PONTO_FISCAL',
  competencia VARCHAR(7), -- formato: 2025-01
  filtro_dia_01 BOOLEAN DEFAULT false,
  filtro_dia_25 BOOLEAN DEFAULT false,
  filtro_pendentes BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'ATIVA', -- ATIVA, FINALIZADA, CANCELADA
  total_empresas INTEGER DEFAULT 0,
  total_enviados INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para buscas
CREATE INDEX IF NOT EXISTS idx_listas_competencia ON listas_cobranca(competencia);
CREATE INDEX IF NOT EXISTS idx_listas_tipo ON listas_cobranca(tipo);
CREATE INDEX IF NOT EXISTS idx_listas_status ON listas_cobranca(status);

-- RLS
ALTER TABLE listas_cobranca ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura listas" ON listas_cobranca FOR SELECT USING (true);
CREATE POLICY "Permitir inserção listas" ON listas_cobranca FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização listas" ON listas_cobranca FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão listas" ON listas_cobranca FOR DELETE USING (true);
