import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { AuthGuard } from "@/components/AuthGuard";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pilates")({ component: Pilates });
const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function SectionTitle({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <h2 className="text-lg font-bold tracking-tight text-black/80">
        {title}
      </h2>
      {typeof count === "number" && (
        <span className="text-sm font-semibold text-black/45">{count}</span>
      )}
    </div>
  );
}

function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [d, setD] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    const db = supabase as any;
    const [s, sp, p, t, pl, te, ce] = await Promise.all([
      db.from("students").select("*"),
      db.from("student_plans").select("*"),
      db.from("student_payments").select("*"),
      db.from("trial_classes").select("*"),
      db.from("plans").select("*"),
      db.from("teachers").select("*"),
      db.from("clinic_cash_expenses").select("*"),
    ]);
    const e = [s, sp, p, t, pl, te, ce].find((x: any) => x.error)?.error;
    if (e) setError(e.message);
    setD({
      s: s.data || [],
      sp: sp.data || [],
      p: p.data || [],
      t: t.data || [],
      pl: pl.data || [],
      te: te.data || [],
      ce: ce.data || [],
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("dashboard-payments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_payments" },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_plans" },
        () => load()
      )
      .subscribe();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      supabase.removeChannel(ch);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const m = useMemo(() => {
    const {
      s = [],
      sp = [],
      p = [],
      t = [],
      pl = [],
      te = [],
      ce = [],
    } = d;
    const monthStart = `${month}-01`;
    const monthEnd = new Date(
      Number(month.slice(0, 4)),
      Number(month.slice(5, 7)),
      0
    )
      .toISOString()
      .slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const planById = new Map<string, any>(sp.map((x: any) => [x.id, x]));
    const matchTeacher = (planId: any) =>
      teacherFilter === "all" ||
      planById.get(planId)?.teacher_id === teacherFilter;
    const active = sp.filter(
      (x: any) =>
        x.status === "Ativo" &&
        (x.start_date || "0000-00-00") <= monthEnd &&
        (!x.end_date || x.end_date >= monthStart) &&
        (teacherFilter === "all" || x.teacher_id === teacherFilter)
    );
    const activeStudents = s.filter((x: any) => x.active);
    const inactiveStudents = s.filter((x: any) => !x.active);
    const activeIds = new Set(activeStudents.map((x: any) => x.id));
    const financialPayments = p.filter(
      (x: any) =>
        activeIds.has(x.student_id) &&
        matchTeacher(x.plan_id) &&
        x.status !== "Cancelado" &&
        x.due_date >= monthStart &&
        x.due_date <= monthEnd
    );
    const clinicReceived = financialPayments
      .filter((x: any) => x.status === "Pago" && x.destination === "Clínica")
      .reduce((a: number, x: any) => a + Number(x.amount || 0), 0);
    const professorReceived = financialPayments
      .filter((x: any) => x.status === "Pago" && x.destination === "Professor")
      .reduce((a: number, x: any) => a + Number(x.amount || 0), 0);
    const cashExpenses = ce
      .filter(
        (x: any) =>
          String(x.expense_date || "").slice(0, 7) === month &&
          x.status !== "Cancelado"
      )
      .reduce((a: number, x: any) => a + Number(x.amount || 0), 0);
    const cashBalance = clinicReceived - cashExpenses;

    return {
      activeStudents: activeStudents.length,
      inactive: inactiveStudents.length,
      activePlans: active.length,
      closed: sp.filter((x: any) => x.status !== "Ativo").length,
      recurring: active.reduce(
        (a: number, x: any) => a + Number(x.monthly_value || 0),
        0
      ),
      current: financialPayments
        .filter((x: any) => x.status === "Pago")
        .reduce((a: number, x: any) => a + Number(x.amount || 0), 0),
      expected: active
        .filter((x: any) => activeIds.has(x.student_id))
        .reduce((a: number, x: any) => a + Number(x.monthly_value || 0), 0),
      overdue: financialPayments
        .filter(
          (x: any) => x.status !== "Pago" && x.due_date && x.due_date < today
        )
        .reduce((a: number, x: any) => a + Number(x.amount || 0), 0),
      clinicReceived,
      professorReceived,
      cashExpenses,
      cashBalance,
      trials: t.filter(
        (x: any) =>
          !x.scheduled_date ||
          (x.scheduled_date >= monthStart && x.scheduled_date <= monthEnd)
      ).length,
      scheduled: t.filter(
        (x: any) =>
          x.status === "Agendada" &&
          (!x.scheduled_date ||
            (x.scheduled_date >= monthStart && x.scheduled_date <= monthEnd))
      ).length,
      done: t.filter(
        (x: any) =>
          x.status === "Realizada" &&
          (!x.scheduled_date ||
            (x.scheduled_date >= monthStart && x.scheduled_date <= monthEnd))
      ).length,
      converted: t.filter(
        (x: any) =>
          x.status === "Convertida" &&
          (!x.scheduled_date ||
            (x.scheduled_date >= monthStart && x.scheduled_date <= monthEnd))
      ).length,
      cancelled: t.filter(
        (x: any) =>
          x.status === "Cancelada" &&
          (!x.scheduled_date ||
            (x.scheduled_date >= monthStart && x.scheduled_date <= monthEnd))
      ).length,
      byPlan: pl.map((x: any) => [
        x.name,
        active.filter((y: any) => y.plan_id === x.id).length,
      ]),
      byTeacher: te
        .map((x: any) => [
          x.name,
          active.filter((y: any) => y.teacher_id === x.id).length,
        ])
        .filter((x: any) => x[1]),
    };
  }, [d, month, teacherFilter]);

  if (loading)
    return (
      <div className="py-12 text-center text-sm text-black/45">
        Carregando indicadores...
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-black/45">Pilates</p>
        <h1 className="mt-1 text-3xl font-semibold">Dashboard Pilates</h1>
        <p className="mt-2 text-sm text-black/55">
          Todos os indicadores são calculados a partir dos dados reais do módulo.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap items-end gap-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div>
          <label className="text-xs font-medium text-black/50">
            Período do Dashboard
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="mt-1 block rounded-xl border border-black/10 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-black/50">Professor</label>
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="mt-1 block rounded-xl border border-black/10 px-3 py-2 text-sm"
          >
            <option value="all">Todos os professores</option>
            {(d.te || []).map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <p className="pb-2 text-sm text-black/45">
          Os indicadores respeitam o período e o professor selecionados.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="mb-9">
        <SectionTitle title="Alunos e planos" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-black/45">Alunos ativos</p>
            <p className="mt-1 text-2xl font-bold">{m.activeStudents}</p>
          </div>
          <div>
            <p className="text-xs text-black/45">Alunos desativados</p>
            <p className="mt-1 text-2xl font-bold">{m.inactive}</p>
          </div>
          <div>
            <p className="text-xs text-black/45">Planos ativos</p>
            <p className="mt-1 text-2xl font-bold">{m.activePlans}</p>
            <p className="text-xs text-black/40">{m.closed} encerrados/inativos</p>
          </div>
          <div>
            <p className="text-xs text-black/45">Planos cadastrados</p>
            <p className="mt-1 text-2xl font-bold">{d.pl?.length || 0}</p>
          </div>
        </div>
      </section>

      <section className="mb-9">
        <SectionTitle title="Receitas" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-black/45">Destino: Professor</p>
            <p className="mt-1 text-2xl font-bold">{brl(m.professorReceived)}</p>
          </div>
          <div>
            <p className="text-xs text-black/45">Destino: Clínica</p>
            <p className="mt-1 text-2xl font-bold">{brl(m.clinicReceived)}</p>
          </div>
          <div>
            <p className="text-xs text-black/45">Receita recorrente</p>
            <p className="mt-1 text-2xl font-bold">{brl(m.recurring)}</p>
          </div>
          <div>
            <p className="text-xs text-black/45">Caixa Pilates</p>
            <p className="mt-1 text-2xl font-bold">{brl(m.cashBalance)}</p>
          </div>
          <div>
            <p className="text-xs text-black/45">Receita atual</p>
            <p className="mt-1 text-2xl font-bold">{brl(m.current)}</p>
          </div>
          <div>
            <p className="text-xs text-black/45">Receita prevista</p>
            <p className="mt-1 text-2xl font-bold">{brl(m.expected)}</p>
          </div>
          <div>
            <p className="text-xs text-black/45">Mensalidades vencidas</p>
            <p className="mt-1 text-2xl font-bold">{brl(m.overdue)}</p>
          </div>
        </div>
      </section>

      <section className="mb-9">
        <SectionTitle title="Aulas experimentais" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="text-xs text-black/45">Total</p>
            <p className="mt-1 text-2xl font-bold">{m.trials}</p>
          </div>
          <div>
            <p className="text-xs text-black/45">Agendadas</p>
            <p className="mt-1 text-2xl font-bold">{m.scheduled}</p>
          </div>
          <div>
            <p className="text-xs text-black/45">Realizadas</p>
            <p className="mt-1 text-2xl font-bold">{m.done}</p>
          </div>
          <div>
            <p className="text-xs text-black/45">Convertidas</p>
            <p className="mt-1 text-2xl font-bold">{m.converted}</p>
          </div>
          <div>
            <p className="text-xs text-black/45">Canceladas</p>
            <p className="mt-1 text-2xl font-bold">{m.cancelled}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <SectionTitle title="Alunos ativos por plano" />
          <div className="mt-5 space-y-3">
            {m.byPlan?.map((x: any) => (
              <div
                key={x[0]}
                className="flex items-center justify-between rounded-lg bg-black/[.02] px-3 py-2.5 text-sm"
              >
                <span>{x[0]}</span>
                <strong>{x[1]}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <SectionTitle title="Alunos ativos por professor" />
          <div className="mt-5 space-y-3">
            {m.byTeacher?.length ? (
              m.byTeacher.map((x: any) => (
                <div
                  key={x[0]}
                  className="flex items-center justify-between rounded-lg bg-black/[.02] px-3 py-2.5 text-sm"
                >
                  <span>{x[0]}</span>
                  <strong>{x[1]}</strong>
                </div>
              ))
            ) : (
              <p className="text-sm text-black/45">Nenhum aluno vinculado.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Pilates() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f7f7f5]">
        <TopBar />
        <AppShell>
          {pathname === "/pilates" ? <Dashboard /> : <Outlet />}
        </AppShell>
      </div>
    </AuthGuard>
  );
}
