
CREATE TYPE public.asset_category AS ENUM ('MMF','STOCKS','REITS','CASH','REAL_ESTATE');
CREATE TYPE public.risk_level AS ENUM ('LOW','MEDIUM','HIGH');
CREATE TYPE public.alert_severity AS ENUM ('INFO','WARNING','DANGER');

CREATE TABLE public.income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.income TO authenticated;
GRANT ALL ON public.income TO service_role;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own income" ON public.income FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  category public.asset_category NOT NULL,
  value numeric NOT NULL CHECK (value >= 0),
  liquidity smallint NOT NULL DEFAULT 3 CHECK (liquidity BETWEEN 1 AND 5),
  source_income_id uuid REFERENCES public.income(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT ALL ON public.assets TO service_role;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own assets" ON public.assets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  target numeric NOT NULL CHECK (target > 0),
  current numeric NOT NULL DEFAULT 0 CHECK (current >= 0),
  deadline date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals" ON public.goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  total_assets numeric NOT NULL,
  liquidity_ratio numeric NOT NULL,
  roi numeric NOT NULL,
  risk_level public.risk_level NOT NULL,
  date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.snapshots TO authenticated;
GRANT ALL ON public.snapshots TO service_role;
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own snapshots" ON public.snapshots FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'INFO',
  date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own alerts" ON public.alerts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX ON public.income(user_id, date DESC);
CREATE INDEX ON public.assets(user_id, category);
CREATE INDEX ON public.goals(user_id);
CREATE INDEX ON public.snapshots(user_id, date DESC);
CREATE INDEX ON public.alerts(user_id, date DESC);
