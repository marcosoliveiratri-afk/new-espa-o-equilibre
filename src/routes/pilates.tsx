import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { AuthGuard } from "@/components/AuthGuard";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, CalendarClock, CheckCircle2, CircleDollarSign, Landmark, Users, UserRoundCheck, UserX, Wallet } from "lucide-react";

export const Route = createFileRoute("/pilates")({ component: Pilates });

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ACCENT_COLORS = {
  info: { bg: "#EAF2FF", icon: "#3B82F6" },
  receiving: { bg: "#E8F7EF", icon: "#16A36A" },
  overdue: { bg: "#FDECEC", icon: "#E05252" },
} as const;

function Card({
  title, value, icon, detail, accent = "info",
}: {
  title: string; value: string; icon: any; detail?: string;
  accent?: "info" | "receiving" | "overdue";
}) {
  const c = ACCENT_COLORS[accent] || ACCENT_COLORS.info;
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: "#FFFFFF", boxShadow: "0 8px 24px rgba(16, 24, 40, 0.05)", display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon({ size: 18, color: c.icon })}
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 400, color: "#64748B", marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 26, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{value}</p>
        {detail && <p style={{ fontSize: 12, color: "#64748B", marginTop: 4, lineHeight: 1.4 }}>{detail}</p>}
      </div>
    </div>
  );
}

function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
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
    setD({ s: s.data || [], sp: sp.data || [], p: p.data || [], t: t.data || [], pl: pl.data || [], te: te.data || [], ce: ce.data || [] });
    setLoading(false);
  };

  useDataSync(load);

  const m = useMemo(() => {
    const { s = [], sp = [], p = [], t = [], pl = [], te = [], ce = [] } = d;
    const monthStart = `${month}-01`;
    const monthEnd = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const planById = new Map<string, any>(sp.map((x: any) => [x.id, x]));
    const matchTeacher = (planId: any) => teacherFilter === "all" || planById.get(planId)?.teacher_id === teacherFilter;
    const active = sp.filter((x: any) => x.status === "Ativo" && (x.start_date || "0000-00-00") <= monthEnd && (!x.end_date || x.end_date >= monthStart) && (teacherFilter === "all" || x.teacher_id === teacherFilter));
    const activeStudents = s.filter((x: any) => x.active);
    const inactiveStudents = s.filter((x: any) => !x.active);
    const activeIds = new Set(activeStudents.map((x: any) => x.id));
    const financialPayments = p.filter((x: any) => activeIds.has(x.student_id) && matchTeacher(x.plan_id) && x.status !== "Cancelado" && x.due_date >= monthStart && x.due_date <= monthEnd);
    const clinicReceived = financialPayments.filter((x: any) => x.status === "Pago" && x.destination === "Clínica").reduce((a: number, x: any) => a + Number(x.amount || 0), 0);
    const professorReceived = financialPayments.filter((x: any) => x.status === "Pago" && x.destination === "Professor").reduce((a: number, x: any) => a + Number(x.amount || 0), 0);
    const cashExpenses = ce.filter((x: any) => String(x.expense_date || "").slice(0, 7) === month && x.status !== "Cancelado").reduce((a: number, x: any) => a + Number(x.amount || 0), 0);
    const cashBalance = clinicReceived - cashExpenses;
    return {
      activeStudents: activeStudents.length, inactive: inactiveStudents.length,
      activePlans: active.length, closed: sp.filter((x: any) => x.status !== "Ativo").length,
      recurring: active.reduce((a: number, x: any) => a + Number(x.monthly_value || 0), 0),
      current: financialPayments.filter((x: any) => x.status === "Pago").reduce((a: number, x: any) => a + Number(x.amount || 0), 0),
      expected: active.reduce((a: number, x: any) => a + Number(x.monthly_value || 0), 0),
      overdue: financialPayments.filter((x: any) => x.status !== "Pago" && x.due_date && x.due_date < today).reduce((a: number, x: any) => a + Number(x.amount || 0), 0),
      clinicReceived, professorReceived, cashExpenses, cashBalance,
      trials: t.filter((x: any) => !x.scheduled_date || (x.scheduled_date >= monthStart && x.scheduled_date <= monthEnd)).length,
      scheduled: t.filter((x: any) => x.status === "Agendada" && (!x.scheduled_date || (x.scheduled_date >= monthStart && x.scheduled_date <= monthEnd))).length,
      done: t.filter((x: any) => x.status === "Realizada" && (!x.scheduled_date || (x.scheduled_date >= monthStart && x.scheduled_date <= monthEnd))).length,
      converted: t.filter((x: any) => x.status === "Convertida" && (!x.scheduled_date || (x.scheduled_date >= monthStart && x.scheduled_date <= monthEnd))).length,
      cancelled: t.filter((x: any) => x.status === "Cancelada" && (!x.scheduled_date || (x.scheduled_date >= monthStart && x.scheduled_date <= monthEnd))).length,
      byPlan: pl.map((x: any) => [x.name, active.filter((y: any) => y.plan_id === x.id).length]),
      byTeacher: te.map((x: any) => [x.name, active.filter((y: any) => y.teacher_id === x.id).length]).filter((x: any) => x[1]),
    };
  }, [d, month, teacherFilter]);

  if (loading) return <div className="py-12 text-center text-sm text-black/45">Carregando indicadores...</div>;

  const groups: any[] = [
    ["Alunos e planos", "info", [
      ["Alunos ativos", String(m.activeStudents), Users, "Em acompanhamento"],
      ["Alunos desativados", String(m.inactive), UserX, "Alunos perdidos/desativados"],
      ["Planos ativos", String(m.activePlans), CheckCircle2, `${m.closed} encerrados/inativos`],
      ["Planos cadastrados", String(d.pl?.length || 0), Activity],
    ]],
    ["Receitas", "receiving", [
      ["Destino: Professor", brl(m.professorReceived), UserRoundCheck, "Total recebido com destino Professor"],
      ["Destino: Clínica", brl(m.clinicReceived), Landmark, "Total recebido com destino Clínica"],
      ["Receita recorrente", brl(m.recurring), CircleDollarSign, "Soma mensal dos planos ativos"],
      ["Caixa Pilates", brl(m.cashBalance), Wallet, "Receita da clínica menos gastos do período"],
      ["Receita atual", brl(m.current), Wallet, "Pagamentos marcados como pagos"],
      ["Receita prevista", brl(m.expected), CalendarClock, "Pagamentos futuros/pendentes"],
      ["Mensalidades vencidas", brl(m.overdue), Activity, "Valores pendentes em atraso"],
    ]],
    ["Aulas experimentais", "info", [
      ["Total", String(m.trials), Users],
      ["Agendadas", String(m.scheduled), CalendarClock],
      ["Realizadas", String(m.done), CheckCircle2],
      ["Convertidas", String(m.converted), UserRoundCheck],
      ["Canceladas", String(m.cancelled), Activity],
    ]],
  ];

  return (
    <div className="mx-auto max-w-7xl" style={{ background: "#F5F6FA", minHeight: "100vh" }}>
      <div className="mb-8 overflow-hidden rounded-3xl border p-7 text-white" style={{ background: "linear-gradient(to right, #1f2937, #334155, #0f766e)", boxShadow: "0 18px 40px -24px rgba(15,23,42,.7)" }}>
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/60">Módulo Pilates</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Dashboard Pilates</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/70">Todos os indicadores são calculados a partir dos dados reais do módulo.</p>
      </div>

      <div className="mb-8 flex flex-wrap items-end gap-4 rounded-2xl border border-black/10 bg-white p-5" style={{ boxShadow: "0 8px 24px rgba(16, 24, 40, 0.05)" }}>
        <div>
          <label className="text-xs font-medium text-black/50">Período do Dashboard</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-1 block rounded-xl border border-black/10 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-black/50">Professor</label>
          <select value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)} className="mt-1 block rounded-xl border border-black/10 px-3 py-2 text-sm">
            <option value="all">Todos os professores</option>
            {(d.te || []).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <p className="pb-2 text-sm text-black/45">Os indicadores respeitam o período e o professor selecionados.</p>
      </div>

      {error && <div className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {groups.map(([title, accent, cards]: any) => (
        <section key={title} className="mb-9">
          <div className="mb-4"><h2 className="text-lg font-bold tracking-tight text-black/80">{title}</h2></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 16 }}>
            {cards.map((x: any) => <Card key={x[0]} title={x[0]} value={x[1]} icon={x[2]} detail={x[3]} accent={accent} />)}
          </div>
        </section>
      ))}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6" style={{ boxShadow: "0 8px 24px rgba(16, 24, 40, 0.05)" }}>
          <h2 className="text-lg font-bold tracking-tight text-black/80">Alunos ativos por plano</h2>
          <div className="mt-5 space-y-3">
            {m.byPlan?.map((x: any) => <div key={x[0]} className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm" style={{ background: "rgba(0,0,0,0.02)" }}><span>{x[0]}</span><strong>{x[1]}</strong></div>)}
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-6" style={{ boxShadow: "0 8px 24px rgba(16, 24, 40, 0.05)" }}>
          <h2 className="text-lg font-bold tracking-tight text-black/80">Alunos ativos por professor</h2>
          <div className="mt-5 space-y-3">
            {m.byTeacher?.length ? m.byTeacher.map((x: any) => <div key={x[0]} className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm" style={{ background: "rgba(0,0,0,0.02)" }}><span>{x[0]}</span><strong>{x[1]}</strong></div>) : <p className="text-sm text-black/45">Nenhum aluno vinculado.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pilates() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F5F6FA]">
        <TopBar />
        <AppShell>
          {pathname === "/pilates" ? <Dashboard /> : <Outlet />}
        </AppShell>
      </div>
    </AuthGuard>
  );
}
