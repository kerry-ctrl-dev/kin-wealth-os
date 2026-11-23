CREATE INDEX IF NOT EXISTS idx_assets_source_income_id ON public.assets (source_income_id);
CREATE INDEX IF NOT EXISTS idx_expenses_source_income_id ON public.expenses (source_income_id);