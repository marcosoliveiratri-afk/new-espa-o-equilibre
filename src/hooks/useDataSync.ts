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
 * Mantém os dados sincronizados sem interromper a navegação.
 *
 * A atualização acontece no mount e quando há mudanças relevantes no banco.
 * Evitamos atualizações periódicas, por foco/visibilidade ou durante rolagem,
 * pois elas podem reconstruir listas e alterar a posição do scroll.
 */
export function useDataSync(load: () => void | Promise<void>, deps: unknown[] = []) {
  const ref = useRef(load);
  ref.current = load;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let loading = false;
    let pending = false;

    const run = () => {
      if (timer) clearTimeout(timer);

      timer = setTimeout(async () => {
        if (loading) {
          pending = true;
          return;
        }

        loading = true;
        try {
          await ref.current();
        } finally {
          loading = false;

          if (pending) {
            pending = false;
            run();
          }
        }
      }, 250);
    };

    // Carrega os dados apenas na entrada da tela.
    void ref.current();

    const db = supabase as any;
    const channel = db.channel(`sync-${Math.random().toString(36).slice(2)}`);

    TABLES.forEach((table) =>
      channel.on("postgres_changes", { event: "*", schema: "public", table }, run)
    );

    channel.subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      db.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
