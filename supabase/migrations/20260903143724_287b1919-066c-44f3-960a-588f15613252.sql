ALTER TABLE public.students REPLICA IDENTITY FULL;
ALTER TABLE public.student_contracts REPLICA IDENTITY FULL;
ALTER TABLE public.physical_assessments REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.students; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.student_contracts; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.physical_assessments; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;