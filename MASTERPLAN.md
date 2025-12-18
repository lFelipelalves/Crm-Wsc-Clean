# 🏠 Sistema Controle WSC Contabilidade (Masterplan)

Use esta página como a "Home" do seu projeto. Ela deve conter o link para tudo.

---

## 1. 🔭 Visão Geral

**Objetivo Principal:** Automatizar a gestão operacional do escritório de contabilidade WSC, focando em cobrança automática de ponto fiscal, gestão de empresas clientes e controle de atividades recorrentes.

**Problema a Resolver:**
- Processo manual de cobrança de ponto dos clientes (esquecimentos frequentes)
- Falta de centralização das informações de empresas e contatos
- Dificuldade em acompanhar status de envio e resposta dos clientes
- Ausência de histórico de cobranças e automações

**Stack Tecnológico:**
- **Frontend:** Next.js 16.0.10 (App Router), TypeScript, Tailwind CSS v4, Shadcn UI
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Automação:** n8n (Webhooks + Integração WhatsApp via Z-API/Evolution)
- **Deploy:** Vercel
- **Autenticação:** Cookie-based (auth-token) via middleware

---

## 2. 🏗️ Arquitetura & Fluxos

### Diagrama de Arquitetura

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Next.js   │─────▶│  Supabase   │      │     n8n     │─────▶│  WhatsApp   │
│   (Client)  │◀─────│ (Database)  │◀─────│  (Webhook)  │      │   (Z-API)   │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
```

### Fluxo de Cobrança de Ponto (Detalhado)

```
1. Admin acessa /atividades/cobranca-ponto-fiscal
   ↓
2. Cria uma "Lista de Cobrança" selecionando:
   - Empresas do dia 01 e/ou dia 25
   - Mensagem (texto ou áudio)
   ↓
3. Seleciona as empresas a serem cobradas (checkboxes)
   ↓
4. Clica em "Disparar Cobrança"
   ↓
5. Frontend abre modal de progresso em tempo real
   ↓
6. Frontend faz POST para /api/webhook/disparo-cobranca
   ↓
7. Next.js valida dados e faz POST para Webhook do n8n
   ↓
8. n8n recebe lista de empresas e processa:
   - Para cada empresa:
     a. Atualiza status_envio = 'ENVIANDO' no Supabase
     b. Dispara mensagem via WhatsApp (Z-API)
     c. Atualiza status_envio = 'ENVIADO' ou 'ERRO'
   ↓
9. Frontend atualiza progresso em tempo real consultando Supabase
   ↓
10. Admin marca manualmente se o cliente enviou o ponto
    (status_resposta: PENDENTE → RECEBIDO/NAO_RECEBIDO)
```

### Fluxo de Reset Mensal

```
Todo dia 8 de cada mês:
1. Admin clica em "Finalizar Lista" na lista ativa
   ↓
2. Sistema marca lista como "FINALIZADA"
   ↓
3. Próximo ciclo: Admin cria nova lista
   ↓
4. Todas as cobranças começam com:
   - status_envio: AGUARDANDO
   - status_resposta: PENDENTE
```

---

## 3. 💾 Banco de Dados (Schema Supabase)

### Tabela: `empresas`

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| id | uuid | PK, Default: gen_random_uuid() | PRIMARY KEY |
| codigo | text | Código único da empresa | UNIQUE, NOT NULL |
| razao_social | text | Nome/Razão social | NOT NULL |
| cnpj | text | CNPJ apenas números | |
| responsavel | text | Nome do responsável principal | |
| telefone | text | Telefone com DDI (55119...) | |
| email | text | Email de contato | |
| dia_cobranca | int2 | Dia do mês (1-31) | NOT NULL, CHECK (1-31) |
| ativo | boolean | Se está ativa | DEFAULT true |
| created_at | timestamptz | Data de criação | DEFAULT now() |
| updated_at | timestamptz | Data de atualização | DEFAULT now() |

**RLS Policies:**
```sql
-- Desabilitado por enquanto (autenticação simples)
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON empresas FOR ALL USING (true);
```

---

### Tabela: `listas_cobranca`

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| id | uuid | PK | PRIMARY KEY |
| nome | text | Nome da lista | NOT NULL |
| tipo | text | Tipo de cobrança | DEFAULT 'COBRANCA_PONTO' |
| competencia | text | Mês/Ano (ex: "01/2025") | |
| filtro_dia_01 | boolean | Se incluiu dia 01 | DEFAULT false |
| filtro_dia_25 | boolean | Se incluiu dia 25 | DEFAULT false |
| filtro_pendentes | boolean | Se filtrou pendentes | DEFAULT false |
| status | text | ATIVA, FINALIZADA, CANCELADA | DEFAULT 'ATIVA' |
| total_empresas | int4 | Total de empresas | DEFAULT 0 |
| total_enviados | int4 | Total enviados com sucesso | DEFAULT 0 |
| mensagem_padrao | text | Mensagem padrão da lista | |
| tipo_mensagem_padrao | text | TEXTO ou AUDIO | |
| arquivo_audio_url | text | URL do áudio (se tipo=AUDIO) | |
| created_at | timestamptz | Data de criação | DEFAULT now() |
| updated_at | timestamptz | Data de atualização | DEFAULT now() |

**Índices:**
```sql
CREATE INDEX idx_listas_status ON listas_cobranca(status);
CREATE INDEX idx_listas_created ON listas_cobranca(created_at DESC);
```

---

### Tabela: `cobrancas_ponto`

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| id | uuid | PK | PRIMARY KEY |
| lista_id | uuid | FK → listas_cobranca | NOT NULL, FK |
| empresa_id | uuid | FK → empresas | NOT NULL, FK |
| status_envio | text | AGUARDANDO, ENVIANDO, ENVIADO, ERRO | DEFAULT 'AGUARDANDO' |
| status_resposta | text | PENDENTE, RECEBIDO, NAO_RECEBIDO | DEFAULT 'PENDENTE' |
| data_envio | timestamptz | Quando foi enviado | |
| mensagem_enviada | text | Conteúdo da mensagem enviada | |
| tipo_mensagem | text | TEXTO ou AUDIO | |
| observacoes | text | Observações manuais | |
| tentativas | int4 | Número de tentativas de envio | DEFAULT 0 |
| created_at | timestamptz | Data de criação | DEFAULT now() |
| updated_at | timestamptz | Data de atualização | DEFAULT now() |

**Índices:**
```sql
CREATE INDEX idx_cobrancas_lista ON cobrancas_ponto(lista_id);
CREATE INDEX idx_cobrancas_empresa ON cobrancas_ponto(empresa_id);
CREATE INDEX idx_cobrancas_status_envio ON cobrancas_ponto(status_envio);
CREATE INDEX idx_cobrancas_status_resposta ON cobrancas_ponto(status_resposta);
```

**Foreign Keys:**
```sql
ALTER TABLE cobrancas_ponto 
  ADD CONSTRAINT fk_lista 
  FOREIGN KEY (lista_id) 
  REFERENCES listas_cobranca(id) 
  ON DELETE CASCADE;

ALTER TABLE cobrancas_ponto 
  ADD CONSTRAINT fk_empresa 
  FOREIGN KEY (empresa_id) 
  REFERENCES empresas(id) 
  ON DELETE CASCADE;
```

---

## 4. 🔌 Automação & Webhooks (n8n Specs)

### Workflow: Disparo de Cobrança

**Webhook URL:** `https://n8n.seuservidor.com/webhook/disparo-cobranca-ponto`

**Método:** `POST`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_N8N_TOKEN"
}
```

**JSON Payload (O que o Frontend envia):**
```json
{
  "acao": "disparo_lote",
  "lista_id": "uuid-da-lista",
  "tipo_mensagem": "TEXTO",
  "mensagem_template": "Olá, {{nome_empresa}}! Lembrando que hoje é dia de enviar o ponto dos funcionários. Aguardamos o envio até as 18h. Obrigado!",
  "empresas": [
    {
      "id": "uuid-empresa-1",
      "codigo": "44",
      "razao_social": "ABC Ltda",
      "telefone": "5511999999999",
      "responsavel": "DAIANE"
    },
    {
      "id": "uuid-empresa-2",
      "codigo": "45",
      "razao_social": "XYZ Comércio",
      "telefone": "5511888888888",
      "responsavel": "LUCAS"
    }
  ]
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "processadas": 2,
  "enviadas": 2,
  "falhas": 0,
  "detalhes": [
    {
      "empresa_id": "uuid-empresa-1",
      "status": "enviado",
      "timestamp": "2025-01-15T14:30:00Z"
    },
    {
      "empresa_id": "uuid-empresa-2",
      "status": "enviado",
      "timestamp": "2025-01-15T14:30:05Z"
    }
  ]
}
```

### Workflow n8n (Resumo dos Nodes)

```
1. Webhook Trigger
   ↓
2. Function (Validar JSON)
   ↓
3. Loop sobre empresas
   ↓
4. Supabase: UPDATE cobrancas_ponto SET status_envio='ENVIANDO'
   ↓
5. HTTP Request → Z-API (Enviar WhatsApp)
   ↓
6. IF: Sucesso?
   ├─ SIM: Supabase UPDATE status_envio='ENVIADO'
   └─ NÃO: Supabase UPDATE status_envio='ERRO', tentativas+1
   ↓
7. Aguardar 2 segundos (rate limiting)
   ↓
8. Próxima empresa (loop)
   ↓
9. Webhook Response (Retornar resumo)
```

---

## 5. 🎨 Interface & Componentes

### Design System
- **Framework:** Shadcn UI + Tailwind CSS v4
- **Cores:** Design tokens definidos em `app/globals.css`
- **Tipografia:** Geist Sans (headings) + Geist Mono (código)

### Páginas Principais

| Rota | Descrição | Status |
|------|-----------|--------|
| `/login` | Autenticação com vídeo de fundo | ✅ Implementada |
| `/` | Dashboard com métricas gerais | ✅ Implementada |
| `/empresas` | CRUD de empresas | ✅ Implementada |
| `/empresas/[id]` | Detalhes de uma empresa | ✅ Implementada |
| `/atividades/cobranca-ponto-fiscal` | Gestão de cobrança de ponto | ✅ Implementada |
| `/atividades/cobranca-documento-fiscal` | Gestão de doc fiscal | ⏳ Pendente |
| `/atividades/envio-guias-fiscal` | Envio de guias fiscais | ⏳ Pendente |
| `/atividades/envio-documentos-contabil` | Envio de docs contábeis | ⏳ Pendente |
| `/atividades/envio-guias-contabil` | Envio de guias contábeis | ⏳ Pendente |
| `/atividades/cobranca-recibo-aluguel` | Cobrança de aluguel | ⏳ Pendente |
| `/atividades/cobranca-faturamento` | Cobrança de faturamento | ⏳ Pendente |
| `/onboarding` | Onboarding de clientes | ✅ Implementada |

### Componentes Chave

**Layout:**
- `components/layout/sidebar.tsx` - Navegação lateral
- `components/layout/app-layout.tsx` - Wrapper com sidebar

**Empresas:**
- `components/empresas/empresa-table.tsx` - Tabela de empresas
- `components/empresas/empresa-form-dialog.tsx` - Form de criação/edição
- `components/empresas/contato-form-dialog.tsx` - Form de contatos

**Atividades:**
- `components/atividades/atividade-table.tsx` - Tabela genérica
- `components/atividades/atividade-form.tsx` - Form de atividades

**Dashboard:**
- `components/dashboard/metric-card.tsx` - Cards de métricas
- `components/dashboard/critical-clients-table.tsx` - Tabela de alertas

---

## 6. 🔐 Autenticação & Segurança

### Sistema de Autenticação Atual

**Tipo:** Cookie-based (simples, sem Supabase Auth)

**Credenciais Fixas:**
- Usuário: `lflflf`
- Senha: `lflflf`

**Middleware de Proteção:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const isLoginPage = request.nextUrl.pathname === '/login'

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|placeholder).*)']
}
```

### Próximos Passos (Autenticação Futura)
- [ ] Migrar para Supabase Auth
- [ ] Implementar roles (Admin, Operador, Visualizador)
- [ ] Row Level Security (RLS) por usuário
- [ ] Logs de auditoria

---

## 7. ✅ Backlog de Implementação

### Fase 1: Infraestrutura (Concluída ✅)
- [x] Criar tabelas no Supabase
- [x] Configurar Supabase Client (browser + server)
- [x] Implementar autenticação simples
- [x] Deploy inicial na Vercel

### Fase 2: Cobrança de Ponto (Em Andamento 🔄)
- [x] Página de gestão de empresas (aba Empresas)
- [x] Criação de listas de cobrança
- [x] Seleção de empresas por dia (01/25)
- [x] Interface de disparo com progresso
- [x] Status duplo (envio + resposta)
- [ ] **Integração com n8n webhook**
- [ ] **Envio real via WhatsApp (Z-API)**
- [ ] **Notificações de erro/sucesso**

### Fase 3: Outras Atividades (Pendente ⏳)
- [ ] Página de cobrança de documento fiscal
- [ ] Página de envio de guias fiscais
- [ ] Página de envio de documentos contábeis
- [ ] Página de envio de guias contábeis
- [ ] Página de cobrança de recibo de aluguel
- [ ] Página de cobrança de faturamento

### Fase 4: Melhorias (Futuro 🔮)
- [ ] Dashboard com gráficos de desempenho
- [ ] Relatórios de cobranças (PDF/Excel)
- [ ] Sistema de templates de mensagens
- [ ] Histórico completo de interações
- [ ] Notificações push/email
- [ ] App mobile (React Native)

---

## 8. 📊 Métricas & KPIs

### Métricas Atuais do Dashboard

| Métrica | Descrição | Fonte |
|---------|-----------|-------|
| Total de Empresas | Empresas ativas | `empresas` WHERE ativo=true |
| Onboardings Ativos | Processos em andamento | `onboarding_clientes` WHERE status!='FEITO' |
| Total de Atividades | Todas as atividades | `atividades` (mock atualmente) |

### KPIs Futuros (Pós n8n)

| KPI | Meta | Métrica |
|-----|------|---------|
| Taxa de Envio | >95% | (enviados / total) * 100 |
| Taxa de Resposta | >80% | (recebidos / enviados) * 100 |
| Tempo Médio de Resposta | <4h | AVG(data_resposta - data_envio) |
| Taxa de Erro | <5% | (erros / total) * 100 |

---

## 9. 🚀 Deploy & Ambientes

### Ambientes

| Ambiente | URL | Branch | Auto-Deploy |
|----------|-----|--------|-------------|
| Produção | vercel.app | main | ✅ |
| Preview | vercel-preview.app | feature/* | ✅ |

### Variáveis de Ambiente Necessárias

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://irzscssxwhrjjofpnngc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# n8n (Futuro)
N8N_WEBHOOK_URL=https://n8n.seuservidor.com/webhook/disparo-cobranca-ponto
N8N_WEBHOOK_TOKEN=your-secret-token

# WhatsApp Z-API (Futuro)
ZAPI_INSTANCE_ID=your-instance-id
ZAPI_TOKEN=your-zapi-token
```

---

## 10. 📝 Convenções de Código

### Estrutura de Pastas

```
app/
├── (auth)/
│   └── login/
├── atividades/
│   └── [tipo]/
├── empresas/
│   └── [id]/
└── api/
    └── webhook/

components/
├── layout/
├── ui/
├── dashboard/
├── empresas/
└── atividades/

lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   ├── types.ts
│   └── services/
├── utils/
└── types.ts
```

### Padrões de Nomenclatura

- **Componentes:** PascalCase (`EmpresaFormDialog`)
- **Funções/Hooks:** camelCase (`useEmpresasData`)
- **Arquivos:** kebab-case (`empresa-form-dialog.tsx`)
- **Tipos:** PascalCase com prefixo (`type StatusEnvio`)
- **Enums:** UPPER_SNAKE_CASE (`STATUS_ENVIO.AGUARDANDO`)

### Commits (Conventional Commits)

```
feat: Adiciona página de cobrança de ponto fiscal
fix: Corrige validação de telefone na empresa
chore: Atualiza dependências do projeto
docs: Adiciona documentação do webhook n8n
```

---

## 11. 🐛 Troubleshooting

### Problemas Comuns

**Erro: "Atividade não encontrada"**
- Causa: Rota dinâmica `[id]` capturando rotas específicas
- Solução: Rotas específicas devem vir antes das dinâmicas

**Erro: "Module not found: status-helpers"**
- Causa: Falta de exports nas funções helper
- Solução: Verificar exports em `lib/utils/status-helpers.ts`

**Cookie não persiste após login**
- Causa: Middleware não configurado corretamente
- Solução: Verificar `matcher` no `middleware.ts`

**Supabase RLS bloqueando queries**
- Causa: Políticas RLS muito restritivas
- Solução: Temporariamente: `CREATE POLICY "Allow all" ON table FOR ALL USING (true)`

---

## 12. 📚 Recursos & Links Úteis

### Documentação Oficial
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [n8n Docs](https://docs.n8n.io)

### Projeto Supabase
- **Nome:** wscsystem
- **ID:** irzscssxwhrjjofpnngc
- **Dashboard:** [app.supabase.com/project/irzscssxwhrjjofpnngc](https://app.supabase.com/project/irzscssxwhrjjofpnngc)

### Repositório
- **GitHub:** (adicionar link quando criar)

---

## 13. 👥 Time & Responsabilidades

| Papel | Responsável | Contato |
|-------|-------------|---------|
| Product Owner | WSC | - |
| Developer | v0 + Time WSC | - |
| DevOps | Vercel (auto) | - |

---

**Última Atualização:** Janeiro 2025  
**Versão:** 2.0  
**Status do Projeto:** 🟢 Em Desenvolvimento Ativo
