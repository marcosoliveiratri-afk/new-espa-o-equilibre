ALTER TABLE public.private_lesson_students
  ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paid_at date,
  ADD COLUMN IF NOT EXISTS destination text NOT NULL DEFAULT 'Clínica',
  ADD COLUMN IF NOT EXISTS payment_method text;

ALTER TABLE public.teacher_financial_entries
  ADD COLUMN IF NOT EXISTS destination text NOT NULL DEFAULT 'Professor';

UPDATE public.teacher_financial_entries SET destination = 'Professor' WHERE destination IS NULL;