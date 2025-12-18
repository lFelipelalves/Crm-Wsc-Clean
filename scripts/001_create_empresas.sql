-- Tabela de Empresas
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  razao_social VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  responsavel VARCHAR(255),
  telefone VARCHAR(20),
  email VARCHAR(255),
  dia_cobranca INTEGER DEFAULT 25 CHECK (dia_cobranca >= 1 AND dia_cobranca <= 31),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para buscas
CREATE INDEX IF NOT EXISTS idx_empresas_codigo ON empresas(codigo);
CREATE INDEX IF NOT EXISTS idx_empresas_dia_cobranca ON empresas(dia_cobranca);

-- RLS - Como é sistema interno, permitir acesso total para usuários autenticados
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura para todos" ON empresas FOR SELECT USING (true);
CREATE POLICY "Permitir inserção para todos" ON empresas FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização para todos" ON empresas FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão para todos" ON empresas FOR DELETE USING (true);
