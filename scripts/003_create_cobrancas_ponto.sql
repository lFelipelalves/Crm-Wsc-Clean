-- Tabela de Cobranças de Ponto (itens dentro de cada lista)
CREATE TABLE IF NOT EXISTS cobrancas_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lista_id UUID NOT NULL REFERENCES listas_cobranca(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  status VARCHAR(30) DEFAULT 'AGUARDANDO', -- AGUARDANDO, PENDENTE, ENVIADO, ERRO
  data_envio TIMESTAMP WITH TIME ZONE,
  mensagem_enviada TEXT,
  tipo_mensagem VARCHAR(20), -- TEXTO, AUDIO
  observacoes TEXT,
  tentativas INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para buscas
CREATE INDEX IF NOT EXISTS idx_cobrancas_lista ON cobrancas_ponto(lista_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_empresa ON cobrancas_ponto(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_status ON cobrancas_ponto(status);

-- RLS
ALTER TABLE cobrancas_ponto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura cobrancas" ON cobrancas_ponto FOR SELECT USING (true);
CREATE POLICY "Permitir inserção cobrancas" ON cobrancas_ponto FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização cobrancas" ON cobrancas_ponto FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão cobrancas" ON cobrancas_ponto FOR DELETE USING (true);
