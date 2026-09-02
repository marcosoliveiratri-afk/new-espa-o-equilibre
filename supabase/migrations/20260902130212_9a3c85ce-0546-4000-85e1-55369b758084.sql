ALTER TABLE public.financial_split_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_full_access_financial_split_settings" ON public.financial_split_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_split_settings TO authenticated;
GRANT ALL ON public.financial_split_settings TO service_role;

ALTER TABLE public.teacher_financial_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_full_access_teacher_financial_reports" ON public.teacher_financial_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_financial_reports TO authenticated;
GRANT ALL ON public.teacher_financial_reports TO service_role;

ALTER TABLE public.whatsapp_message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_full_access_whatsapp_message_templates" ON public.whatsapp_message_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_message_templates TO authenticated;
GRANT ALL ON public.whatsapp_message_templates TO service_role;