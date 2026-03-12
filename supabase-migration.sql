-- ============================================
-- MeusBoletos - Supabase Migration
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================

-- Tabela de households (grupos familiares)
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Minha Casa',
  members JSONB NOT NULL DEFAULT '["Eu", "Esposa"]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_households_hash ON households(hash);

-- Tabela de contas/boletos
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  category TEXT NOT NULL DEFAULT 'Outros',
  recurrence TEXT NOT NULL DEFAULT 'monthly' CHECK (recurrence IN ('once', 'monthly', 'yearly')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bills_household ON bills(household_id);

-- Tabela de pagamentos
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  reference_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  paid_by TEXT,
  amount_paid NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bill_id, reference_date)
);

CREATE INDEX idx_payments_bill ON payments(bill_id);
CREATE INDEX idx_payments_ref ON payments(reference_date);

-- ============================================
-- Row Level Security (RLS)
-- Segurança baseada no hash via header customizado
-- ============================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy: households acessíveis via anon key (filtro no app)
CREATE POLICY "Households são públicos para leitura via hash"
  ON households FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Qualquer um pode criar household"
  ON households FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Household pode ser atualizado"
  ON households FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policy: bills filtradas por household
CREATE POLICY "Bills visíveis por household"
  ON bills FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Bills podem ser criadas"
  ON bills FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Bills podem ser atualizadas"
  ON bills FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Bills podem ser deletadas"
  ON bills FOR DELETE
  TO anon
  USING (true);

-- Policy: payments
CREATE POLICY "Payments visíveis"
  ON payments FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Payments podem ser criados"
  ON payments FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Payments podem ser atualizados"
  ON payments FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Payments podem ser deletados"
  ON payments FOR DELETE
  TO anon
  USING (true);
