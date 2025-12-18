-- Adiciona status duplo: envio e resposta
-- status_envio = se a mensagem foi enviada
-- status_resposta = se o cliente enviou o ponto

ALTER TABLE cobrancas_ponto 
  RENAME COLUMN status TO status_envio;

ALTER TABLE cobrancas_ponto 
  ADD COLUMN IF NOT EXISTS status_resposta VARCHAR(30) DEFAULT 'PENDENTE';

-- Atualizar index
DROP INDEX IF EXISTS idx_cobrancas_status;
CREATE INDEX IF NOT EXISTS idx_cobrancas_status_envio ON cobrancas_ponto(status_envio);
CREATE INDEX IF NOT EXISTS idx_cobrancas_status_resposta ON cobrancas_ponto(status_resposta);

-- Comentários explicativos
COMMENT ON COLUMN cobrancas_ponto.status_envio IS 'Status do envio da mensagem: AGUARDANDO, ENVIANDO, ENVIADO, ERRO';
COMMENT ON COLUMN cobrancas_ponto.status_resposta IS 'Status da resposta do cliente: PENDENTE, RECEBIDO, NAO_RECEBIDO';
