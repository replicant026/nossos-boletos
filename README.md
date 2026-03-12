# 💰 Nossos Boletos

Controle de contas a pagar simples e compartilhado. Sem login — acesso via link único.

## Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend:** Supabase (Postgres + RLS)
- **Deploy:** Vercel

## Licenca

Este projeto e distribuido sob a **GNU Affero General Public License v3.0 (AGPL-3.0)**.

- Voce pode usar, estudar, modificar e redistribuir.
- Se distribuir versoes modificadas, deve manter AGPL e disponibilizar o codigo-fonte.
- Se oferecer o software como servico (SaaS), deve disponibilizar o codigo-fonte da versao em uso para os usuarios desse servico.

Veja o arquivo `LICENSE` para o texto completo.

## Setup Rápido

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Vá em **SQL Editor** e execute o conteúdo do arquivo `supabase-migration.sql`
3. Anote a **Project URL** e a **anon key** (em Settings → API)

### 2. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha com os valores do Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://<SEU-PROJETO>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUA_ANON_KEY>
```

### 3. Instalar e Rodar Local

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`

### 4. Deploy na Vercel

1. Suba o projeto no GitHub
2. Importe no [vercel.com](https://vercel.com)
3. Configure as variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy automático!

## Como Usar

1. Acesse a página inicial e crie seu grupo
2. Copie o link gerado e envie via WhatsApp para sua esposa
3. Ambos acessam pelo mesmo link
4. Cadastre suas contas e marque como pagas quando pagar

## Funcionalidades

- ✅ Dashboard mensal com visão de todas as contas
- ✅ Alertas visuais para contas atrasadas e próximas do vencimento
- ✅ Marcar como paga com registro de quem pagou
- ✅ Suporte a recorrência (mensal, anual, única)
- ✅ Categorias com ícones
- ✅ Navegação entre meses
- ✅ Filtro por categoria
- ✅ Compartilhamento via link (sem login)
- ✅ 100% responsivo (mobile-first)
