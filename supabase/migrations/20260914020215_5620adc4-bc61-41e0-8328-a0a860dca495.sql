DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['students','student_plans','student_payments','student_contracts','physical_assessments','student_audit_log','plans','teachers','trial_classes','private_lesson_students','clinic_cash_expenses','financial_split_settings','whatsapp_message_templates','teacher_financial_entries','teacher_financial_reports']
  LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;