
-- Add source_income_id and reference fields to expenses
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS source_income_id uuid REFERENCES public.income(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transaction_code text,
  ADD COLUMN IF NOT EXISTS vendor text;

-- Personal assets (net worth items)
CREATE TABLE IF NOT EXISTS public.personal_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('VEHICLE','HOUSEHOLD','CLOTHES','CASH','ELECTRONICS','OTHER')),
  value numeric NOT NULL CHECK (value >= 0),
  acquired_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_assets TO authenticated;
GRANT ALL ON public.personal_assets TO service_role;
ALTER TABLE public.personal_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own personal_assets" ON public.personal_assets
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Loans
CREATE TABLE IF NOT EXISTS public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lender text NOT NULL,
  principal numeric NOT NULL CHECK (principal > 0),
  interest_rate numeric NOT NULL DEFAULT 0 CHECK (interest_rate >= 0),
  borrowed_at timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz,
  purpose text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REPAID','OVERDUE')),
  amount_repaid numeric NOT NULL DEFAULT 0 CHECK (amount_repaid >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loans TO authenticated;
GRANT ALL ON public.loans TO service_role;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own loans" ON public.loans
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER personal_assets_updated BEFORE UPDATE ON public.personal_assets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER loans_updated BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
