
ALTER TABLE public.loans
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_alt text,
  ADD COLUMN IF NOT EXISTS interest_period text NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN IF NOT EXISTS payment_instructions text,
  ADD COLUMN IF NOT EXISTS reminder_message text;

ALTER TABLE public.loans
  DROP CONSTRAINT IF EXISTS loans_interest_period_check;
ALTER TABLE public.loans
  ADD CONSTRAINT loans_interest_period_check
  CHECK (interest_period IN ('DAILY','WEEKLY','MONTHLY','YEARLY'));
