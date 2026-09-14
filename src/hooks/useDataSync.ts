import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const TABLES = [
  "students",
  "student_plans",
  "student_payments",
  "student_contracts",
  "physical_assessments",
  "student_audit_log",
  "plans",
  "teachers",
  "trial_classes",
  "private_lesson_students",
  "clinic_cash_expenses",
  "financial_split_settings",
  "whatsapp_message_templates",
  "teacher_financial_entries",
  "teacher_financial_reports",
] as const;

/**
 * Mantém a tela sincronizada: recarrega no mount, em qualquer mudança no banco
 * (realtime), ao voltar o foco/aba e a cada 30s como rede de segurança.
 */
export function useDataSync(load: () => void | Promise<void>, deps: unknown[] = []) {
  const ref = useRef(load);
  ref.current = load;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const run = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void ref.current(), 120);
    };

    void ref.current();

    const db = supabase as any;
    const channel = db.channel(`sync-${Math.random().toString(36).slice(2)}`);
    TABLES.forEach((table) =>
      channel.on("postgres_changes", { event: "*", schema: "public", table }, run)
    );
    channel.subscribe();

    const onFocus = () => run();
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(run, 30000);

    return () => {
      if (timer) clearTimeout(timer);
      db.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
