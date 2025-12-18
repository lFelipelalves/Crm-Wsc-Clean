-- Adiciona campo telefone_cobranca na tabela empresas_cobranca_ponto
-- e cria tabela de log de cobranças

-- 1. Adicionar campo telefone_cobranca
ALTER TABLE empresas_cobranca_ponto 
ADD COLUMN IF NOT EXISTS telefone_cobranca VARCHAR(20);

-- 2. Criar tabela de log de cobranças
CREATE TABLE IF NOT EXISTS log_cobranca_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_cobranca_id UUID REFERENCES empresas_cobranca_ponto(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  
  -- Dados da empresa no momento da cobrança (snapshot)
  empresa_codigo VARCHAR(20),
  empresa_nome VARCHAR(255),
  responsavel VARCHAR(255),
  telefone_destino VARCHAR(20),
  dia_cobranca INTEGER,
  
  -- Dados do envio
  mensagem_enviada TEXT,
  tipo_mensagem VARCHAR(10) CHECK (tipo_mensagem IN ('TEXTO', 'AUDIO')),
  arquivo_audio_url TEXT,
  
  -- Status e resposta do webhook
  status_envio VARCHAR(20) DEFAULT 'AGUARDANDO' CHECK (status_envio IN ('AGUARDANDO', 'ENVIANDO', 'ENVIADO', 'ERRO')),
  webhook_enviado_em TIMESTAMP WITH TIME ZONE,
  webhook_resposta JSONB,
  webhook_erro TEXT,
  
  -- Metadados
  competencia VARCHAR(7), -- 2025-01
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_log_cob_ponto_empresa_cob ON log_cobranca_ponto(empresa_cobranca_id);
CREATE INDEX IF NOT EXISTS idx_log_cob_ponto_empresa ON log_cobranca_ponto(empresa_id);
CREATE INDEX IF NOT EXISTS idx_log_cob_ponto_status ON log_cobranca_ponto(status_envio);
CREATE INDEX IF NOT EXISTS idx_log_cob_ponto_competencia ON log_cobranca_ponto(competencia);
CREATE INDEX IF NOT EXISTS idx_log_cob_ponto_created ON log_cobranca_ponto(created_at DESC);

-- RLS
ALTER TABLE log_cobranca_ponto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura para todos" ON log_cobranca_ponto FOR SELECT USING (true);
CREATE POLICY "Permitir inserção para todos" ON log_cobranca_ponto FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização para todos" ON log_cobranca_ponto FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão para todos" ON log_cobranca_ponto FOR DELETE USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_log_cobranca_ponto_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_log_cobranca_ponto
  BEFORE UPDATE ON log_cobranca_ponto
  FOR EACH ROW
  EXECUTE FUNCTION update_log_cobranca_ponto_updated_at();
