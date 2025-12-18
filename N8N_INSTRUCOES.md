# Instruções para Configuração do n8n - Cobrança de Ponto Fiscal

## Resumo do Fluxo

```
n8n (Schedule a cada 5 min)
  ↓ Chama função Postgres
Supabase: buscar_cobrancas_pendentes()
  ↓ Retorna apenas logs PENDENTES + empresas com status_ponto PENDENTE
Loop para cada cobrança
  ↓ Delay random 1-60 min
UPDATE log: PENDENTE → ENVIANDO
  ↓ Envia WhatsApp
UPDATE log: ENVIANDO → ENVIADO/ERRO
  ↓ (Opcional)
UPDATE empresas_cobranca_ponto.status_envio
```

---

## 1. Configuração do Workflow

### Node 1: Schedule Trigger
- **Tipo:** Schedule Trigger
- **Intervalo:** A cada 5 minutos
- **Cron:** `*/5 * * * *`

---

### Node 2: Supabase - Buscar Cobranças (FUNÇÃO POSTGRES)

- **Tipo:** Supabase
- **Credential:** Supabase (Service Role Key)
- **Operação:** Execute a SQL query
- **Query:**

```sql
SELECT * FROM buscar_cobrancas_pendentes();
```

**O que essa função retorna:**
- `log_id` - UUID do log
- `empresa_cobranca_id` - UUID da empresa na tabela cobranca
- `empresa_id` - UUID da empresa principal
- `empresa_codigo` - Código da empresa (varchar)
- `empresa_nome` - Razão social
- `responsavel` - Nome do responsável
- `telefone_destino` - Telefone para envio
- `tipo_mensagem` - "texto" ou "audio"
- `mensagem` - Texto da mensagem (se tipo = texto)
- `arquivo_url` - URL do áudio (se tipo = audio)
- `competencia` - Mês/ano (ex: "2025-01")
- `data_cobranca` - Data/hora agendada (ou NULL para "enviar agora")

**Regras da função:**
- ✅ Apenas logs com `status_envio = PENDENTE`
- ✅ Apenas empresas com `status_ponto = PENDENTE`
- ✅ Apenas cobranças agendadas para agora (`data_cobranca <= NOW()` ou NULL)
- ✅ Ordenado por data de criação (mais antigos primeiro)
- ✅ Limite de 50 cobranças por execução

---

### Node 3: Split In Batches (Loop)

- **Tipo:** Split In Batches
- **Batch Size:** 1 (processar uma por vez)

---

### Node 4: Code - Delay Aleatório

- **Tipo:** Code (JavaScript)
- **Código:**

```javascript
// Delay aleatório entre 1 e 60 minutos
const minMinutes = 1;
const maxMinutes = 60;
const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
const delayMs = randomMinutes * 60 * 1000;

console.log(`[Cobrança ${$json.log_id}] Aguardando ${randomMinutes} minutos antes de enviar...`);

// Aguardar
await new Promise(resolve => setTimeout(resolve, delayMs));

return $input.all();
```

---

### Node 5: Supabase - Atualizar Status para ENVIANDO

- **Tipo:** Supabase
- **Operação:** Update row
- **Table:** `log_cobranca_ponto`
- **Update Key:** `id`
- **Update Key Value:** `={{$json.log_id}}`
- **Fields:**

```json
{
  "status_envio": "ENVIANDO"
}
```

---

### Node 6: HTTP Request - Enviar WhatsApp

**Configuração depende da sua API WhatsApp. Exemplo:**

- **Tipo:** HTTP Request
- **Method:** POST
- **URL:** `https://seu-whatsapp-api.com/send`
- **Headers:**
```json
{
  "Authorization": "Bearer SEU_TOKEN",
  "Content-Type": "application/json"
}
```
- **Body:**

```json
{
  "to": "={{$json.telefone_destino}}",
  "type": "={{$json.tipo_mensagem}}",
  "message": "={{$json.mensagem}}",
  "audio_url": "={{$json.arquivo_url}}"
}
```

**Lógica:**
- Se `tipo_mensagem = "texto"` → usa campo `message`
- Se `tipo_mensagem = "audio"` → usa campo `audio_url`

---

### Node 7: Supabase - Atualizar Log para ENVIADO (Sucesso)

- **Tipo:** Supabase
- **Operação:** Update row
- **Table:** `log_cobranca_ponto`
- **Update Key:** `id`
- **Update Key Value:** `={{$node["Split In Batches"].json.log_id}}`
- **Fields:**

```json
{
  "status_envio": "ENVIADO",
  "enviado_em": "={{$now}}",
  "webhook_response": {{$json}}
}
```

---

### Node 8 (Opcional): Atualizar Status da Empresa

Se quiser marcar que a empresa recebeu cobrança:

- **Tipo:** Supabase
- **Operação:** Update row
- **Table:** `empresas_cobranca_ponto`
- **Update Key:** `id`
- **Update Key Value:** `={{$node["Split In Batches"].json.empresa_cobranca_id}}`
- **Fields:**

```json
{
  "status_envio": "ENVIADO",
  "ultima_cobranca": "={{$now}}"
}
```

**IMPORTANTE:** NÃO atualize `status_ponto` aqui! Esse campo só é alterado manualmente no sistema quando a empresa **realmente enviar o ponto**.

---

### Node 9: Error Trigger - Tratamento de Erro

- **Tipo:** Error Trigger (conectar ao Node 6 ou 7)
- **Conectar a:** Supabase Update
- **Fields:**

```json
{
  "status_envio": "ERRO",
  "erro_mensagem": "={{$json.error.message}}"
}
```

---

## 2. Credenciais Necessárias

### Supabase
- **URL:** `https://irzscssxwhrjjofpnngc.supabase.co`
- **Service Role Key:** (pegar em Settings → API)

### WhatsApp API
- **URL:** Sua API do WhatsApp Business
- **Token:** Seu token de autenticação

---

## 3. Fluxo de Status

### No log_cobranca_ponto:

```
PENDENTE (criado no sistema)
    ↓ (n8n pega na função)
ENVIANDO (n8n marcou antes de enviar)
    ↓ (enviou WhatsApp)
ENVIADO (sucesso) ou ERRO (falha)
```

**Cada envio = 1 registro no log.** Histórico completo de tentativas.

### Na empresas_cobranca_ponto:

- `status_envio`: AGUARDANDO → ENVIADO (atualizado pelo n8n)
- `status_ponto`: PENDENTE → RECEBIDO/NAO_RECEBIDO (atualizado **manualmente** no sistema)

**Sincronização crítica:**
- Se `status_ponto = RECEBIDO`, a função `buscar_cobrancas_pendentes()` **NÃO retorna** mais logs dessa empresa
- Isso evita envios duplicados para empresas que já enviaram o ponto

---

## 4. Agendamento

### Enviar Agora
```sql
INSERT INTO log_cobranca_ponto (..., data_cobranca) VALUES (..., NULL);
```
- n8n processa em até 5 minutos

### Agendar para data/hora específica
```sql
INSERT INTO log_cobranca_ponto (..., data_cobranca) VALUES (..., '2025-01-25 14:30:00');
```
- n8n só processa quando `NOW() >= '2025-01-25 14:30:00'`

---

## 5. Testando o Workflow

### Teste Básico

1. **Criar cobrança no sistema:**
   - Vá em "Cobrança de Ponto" → "Criar Cobrança"
   - Selecione empresas com `status_ponto = PENDENTE`
   - Configure mensagem
   - Clique "Criar Cobrança" (Enviar Agora)

2. **Verificar no Supabase:**
```sql
SELECT * FROM log_cobranca_ponto WHERE status_envio = 'PENDENTE';
```

3. **Testar função manualmente:**
```sql
SELECT * FROM buscar_cobrancas_pendentes();
```
- Deve retornar os logs criados

4. **Aguardar n8n executar:**
   - Máximo 5 minutos (próximo cron)
   - Verifique logs no n8n
   - Status deve mudar: PENDENTE → ENVIANDO → ENVIADO

5. **Verificar no sistema:**
   - Aba "Histórico"
   - Ver status atualizado em tempo real

---

### Teste Agendamento

1. **Agendar para daqui 10 minutos:**
   - Criar cobrança com agendamento
   - `data_cobranca` = NOW() + 10 minutos

2. **Verificar função NÃO retorna:**
```sql
SELECT * FROM buscar_cobrancas_pendentes();
```
- Não deve aparecer (ainda não chegou a hora)

3. **Após 10 minutos:**
   - Executar query novamente
   - Agora deve aparecer
   - n8n vai processar

---

### Teste Sincronização Status

1. **Criar 2 cobranças para mesma empresa**
2. **Aguardar 1ª ser enviada**
3. **Marcar empresa como RECEBIDO:**
```sql
UPDATE empresas_cobranca_ponto 
SET status_ponto = 'RECEBIDO' 
WHERE empresa_id = '...';
```
4. **Verificar função:**
```sql
SELECT * FROM buscar_cobrancas_pendentes();
```
- 2ª cobrança **NÃO deve aparecer** (empresa já recebeu)

---

## 6. Monitoramento

### Logs no n8n
- Console mostra delays aplicados
- Erros de WhatsApp aparecem no Error Trigger

### No Sistema
- Aba "Histórico" mostra todos os disparos
- Filtrar por status, competência, empresa

### Queries SQL Úteis

**Ver cobranças pendentes:**
```sql
SELECT * FROM buscar_cobrancas_pendentes();
```

**Ver histórico de envios por empresa:**
```sql
SELECT 
  e.codigo,
  e.razao_social,
  l.status_envio,
  l.created_at,
  l.enviado_em
FROM log_cobranca_ponto l
JOIN empresas e ON l.empresa_id = e.id
WHERE e.id = 'UUID_DA_EMPRESA'
ORDER BY l.created_at DESC;
```

**Ver empresas que ainda não enviaram ponto:**
```sql
SELECT 
  e.codigo,
  e.razao_social,
  ecp.status_ponto,
  ecp.status_envio
FROM empresas_cobranca_ponto ecp
JOIN empresas e ON ecp.empresa_id = e.id
WHERE ecp.status_ponto = 'PENDENTE';
```

---

## 7. Troubleshooting

### Problema: n8n não processa nada
**Solução:**
1. Verificar credenciais Supabase (Service Role Key)
2. Testar função manualmente: `SELECT * FROM buscar_cobrancas_pendentes();`
3. Verificar se há logs com `status_envio = PENDENTE`

### Problema: Envia duplicado
**Solução:**
- Verificar se `status_ponto` da empresa está PENDENTE
- Se já recebeu, deve estar RECEBIDO

### Problema: Não respeita agendamento
**Solução:**
- Verificar coluna `data_cobranca` no log
- Testar condição: `data_cobranca IS NULL OR data_cobranca <= NOW()`

### Problema: Demora muito para enviar
**Solução:**
- Delays são aleatórios (1-60 min)
- Para testes, reduza o range no Code node

---

## 8. Otimizações Futuras

- **Fila de prioridade:** Processar cobranças urgentes primeiro
- **Retry automático:** Tentar novamente logs com ERRO
- **Notificação de falhas:** Avisar equipe quando houver muitos erros
- **Dashboard:** Métricas de taxa de envio, tempo médio, etc.
