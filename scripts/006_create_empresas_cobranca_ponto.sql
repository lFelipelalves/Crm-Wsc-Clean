-- Tabela de empresas específicas para cobrança de ponto
-- Vincula empresas da tabela geral à atividade de cobrança de ponto

CREATE TABLE IF NOT EXISTS empresas_cobranca_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  dia_cobranca INTEGER NOT NULL CHECK (dia_cobranca IN (1, 25)),
  status_envio VARCHAR(20) DEFAULT 'AGUARDANDO' CHECK (status_envio IN ('AGUARDANDO', 'ENVIANDO', 'ENVIADO', 'ERRO')),
  status_ponto VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status_ponto IN ('PENDENTE', 'RECEBIDO', 'NAO_RECEBIDO')),
  observacoes TEXT,
  ultima_cobranca TIMESTAMP WITH TIME ZONE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garante que cada empresa só pode estar uma vez na cobrança de ponto
  UNIQUE(empresa_id)
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_emp_cob_ponto_empresa ON empresas_cobranca_ponto(empresa_id);
CREATE INDEX IF NOT EXISTS idx_emp_cob_ponto_dia ON empresas_cobranca_ponto(dia_cobranca);
CREATE INDEX IF NOT EXISTS idx_emp_cob_ponto_status_envio ON empresas_cobranca_ponto(status_envio);
CREATE INDEX IF NOT EXISTS idx_emp_cob_ponto_status_ponto ON empresas_cobranca_ponto(status_ponto);

-- RLS
ALTER TABLE empresas_cobranca_ponto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura para todos" ON empresas_cobranca_ponto FOR SELECT USING (true);
CREATE POLICY "Permitir inserção para todos" ON empresas_cobranca_ponto FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização para todos" ON empresas_cobranca_ponto FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão para todos" ON empresas_cobranca_ponto FOR DELETE USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_empresas_cobranca_ponto_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_empresas_cobranca_ponto
  BEFORE UPDATE ON empresas_cobranca_ponto
  FOR EACH ROW
  EXECUTE FUNCTION update_empresas_cobranca_ponto_updated_at();
