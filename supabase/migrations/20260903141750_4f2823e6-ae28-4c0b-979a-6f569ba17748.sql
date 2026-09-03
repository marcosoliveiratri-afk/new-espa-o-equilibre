ALTER TABLE public.student_payments REPLICA IDENTITY FULL;
ALTER TABLE public.student_plans REPLICA IDENTITY FULL;
ALTER TABLE public.teacher_financial_entries REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_financial_entries;