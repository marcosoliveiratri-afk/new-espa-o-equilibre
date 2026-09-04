import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CircleDollarSign,
  Landmark,
  UserRoundCheck,
  Wallet,
  FileDown,
  Save,
  CalendarDays,
  Filter,
  Users,
  CreditCard,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/pilates/fechamentos")({
  component: Fechamentos,
});

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ACCENTS: any = {
  sky: {
    ring: "border-sky-200/70",
    bg: "bg-gradient-to-br from-sky-50 to-white",
    chip: "bg-sky-500/10 text-sky-700",
    bar: "bg-sky-500",
  },
  emerald: {
    ring: "border-emerald-200/70",
    bg: "bg-gradient-to-br from-emerald-50 to-white",
    chip: "bg-emerald-500/10 text-emerald-700",
    bar: "bg-emerald-500",
  },
  violet: {
    ring: "border-violet-200/70",
    bg: "bg-gradient-to-br from-violet-50 to-white",
    chip: "bg-violet-500/10 text-violet-700",
    bar: "bg-violet-500",
  },
  amber: {
    ring: "border-amber-200/70",
    bg: "bg-gradient-to-br from-amber-50 to-white",
    chip: "bg-amber-500/10 text-amber-700",
    bar: "bg-amber-500",
  },
  rose: {
    ring: "border-rose-200/70",
    bg: "bg-gradient-to-br from-rose-50 to-white",
    chip: "bg-rose-500/10 text-rose-700",
    bar: "bg-rose-500",
  },
  slate: {
    ring: "border-slate-200/70",
    bg: "bg-gradient-to-br from-slate-50 to-white",
    chip: "bg-slate-500/10 text-slate-700",
    bar: "bg-slate-500",
  },
};

function Card({
  title,
  value,
  icon: Icon,
  detail,
  accent = "sky",
}: {
  title: string;
  value: string;
  icon: any;
  detail?: string;
  accent?: string;
}) {
  const a = ACCENTS[accent] || ACCENTS.sky;
  return (
    <div
      className={
        "group relative overflow-hidden rounded-2xl border p-5 shadow-[0_1px_2px_rgba(16,24,40,.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgba(16,24,40,.25)] " +
        a.ring +
        " " +
        a.bg
      }
    >
      <span className={"absolute inset-x-0 top-0 h-1 " + a.bar} />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-black/50">
          {title}
        </p>
        <span
          className={
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " +
            a.chip
          }
        >
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-[28px] font-bold leading-none tracking-tight text-black/85">
        {value}
      </p>
      {detail && (
        <p className="mt-2 text-xs leading-snug text-black/45">{detail}</p>
      )}
    </div>
  );
}

function SectionTitle({
  title,
  count,
}: {
  icon?: any;
  title: string;
  tone?: string;
  count?: number;
}) {
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

function Fechamentos() {
  const [split, setSplit] = useState({
    professor_percentage: 50,
    clinic_percentage: 50,
  });
  const [teacher, setTeacher] = useState("all"),
    [teachers, setTeachers] = useState<any[]>([]),
    [plans, setPlans] = useState<any[]>([]),
    [payments, setPayments] = useState<any[]>([]),
    [entries, setEntries] = useState<any[]>([]),
    [month, setMonth] = useState(new Date().toISOString().slice(0, 7)),
    [form, setForm] = useState({
      description: "Aula avulsa",
      amount: "",
      entry_date: new Date().toISOString().slice(0, 10),
    });
  const [error, setError] = useState("");
  const [savingReport, setSavingReport] = useState(false);
  const [basis, setBasis] = useState<"paid_at" | "due_date">("paid_at");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const db = supabase as any;
    const [t, sp, p, e, fs] = await Promise.all([
      db.from("teachers").select("*").eq("active", true).order("name"),
      db.from("student_plans").select("*"),
      db.from("student_payments").select("*"),
      db.from("teacher_financial_entries").select("*"),
      db.from("financial_split_settings").select("*").limit(1).maybeSingle(),
    ]);
    if ([t, sp, p, e, fs].find((x: any) => x.error))
      setError([t, sp, p, e, fs].find((x: any) => x.error)?.error.message);
    setTeachers(t.data || []);
    setPlans(sp.data || []);
    setPayments(p.data || []);
    setEntries(e.data || []);
    if (fs.data)
      setSplit({
        professor_percentage: Number(fs.data.professor_percentage),
        clinic_percentage: Number(fs.data.clinic_percentage),
      });
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("fechamentos-payments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_payments" },
        () => {
          load();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teacher_financial_entries" },
        () => {
          load();
        }
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
    const paid = payments.filter(
      (x: any) =>
        x.status === "Pago" && String(x[basis] || "").slice(0, 7) === month
    );
    const details = paid
      .map((x: any) => ({
        ...x,
        plan: plans.find(
          (p: any) => p.id === x.plan_id || p.plan_id === x.plan_id
        ),
      }))
      .filter((x: any) =>
        teacher === "all" ? true : teacher ? x.plan?.teacher_id === teacher : true
      );
    const planRevenue = details.reduce(
      (a: number, x: any) => a + Number(x.amount || 0),
      0
    );
    const extraRows = entries.filter((x: any) =>
      x.status === "Pago" &&
      x.entry_date?.slice(0, 7) === month &&
      (teacher === "all" ? true : teacher ? x.teacher_id === teacher : false)
    );
    const extra = extraRows.reduce(
      (a: number, x: any) => a + Number(x.amount || 0),
      0
    );
    const total = planRevenue + extra;
    const paymentMethods = details.reduce((acc: any, x: any) => {
      const key = x.payment_method || "Não informado";
      acc[key] = (acc[key] || 0) + Number(x.amount || 0);
      return acc;
    }, {});
    const byTeacher = teachers
      .map((t) => ({
        teacher: t,
        rows: details.filter((x: any) => x.plan?.teacher_id === t.id),
        total: details
          .filter((x: any) => x.plan?.teacher_id === t.id)
          .reduce((a: number, x: any) => a + Number(x.amount || 0), 0),
      }))
      .filter((x: any) => x.rows.length || teacher === "all");
    const destProfessor = details
      .filter((x: any) => x.destination === "Professor")
      .reduce((a: number, x: any) => a + Number(x.amount || 0), 0);
    const destClinica = details
      .filter((x: any) => x.destination === "Clínica")
      .reduce((a: number, x: any) => a + Number(x.amount || 0), 0);
    return {
      details,
      extraRows,
      planRevenue,
      extra,
      total,
      destProfessor,
      destClinica,
      teacherShare: total * (split.professor_percentage / 100),
      clinicShare: total * (split.clinic_percentage / 100),
      paymentMethods,
      byTeacher,
    };
  }, [payments, plans, entries, teacher, month, teachers, split, basis]);

  const reportSnapshot = () => ({
    month,
    teacher,
    teacher_name:
      teacher === "all"
        ? "Todos os professores"
        : teachers.find((t: any) => t.id === teacher)?.name ||
          "Todos os professores",
    total: m.total,
    planRevenue: m.planRevenue,
    extra: m.extra,
    teacherShare: m.teacherShare,
    clinicShare: m.clinicShare,
    paymentMethods: m.paymentMethods,
    details: m.details.map((x: any) => ({
      amount: x.amount,
      destination: x.destination,
      payment_method: x.payment_method,
      paid_at: x.paid_at,
      teacher_id: x.plan?.teacher_id,
    })),
  });

  const saveReport = async () => {
    setSavingReport(true);
    setError("");
    const snap = reportSnapshot();
    const { error } = await (supabase as any)
      .from("teacher_financial_reports")
      .insert({
        month,
        teacher_id: teacher === "all" || !teacher ? null : teacher,
        teacher_name: snap.teacher_name,
        total: m.total,
        snapshot: snap,
      });
    if (error) setError(error.message);
    else alert("Relatório salvo no histórico.");
    setSavingReport(false);
  };

  const printReport = () => {
    const title =
      teacher === "all"
        ? "Todos os professores"
        : teachers.find((t: any) => t.id === teacher)?.name || "Professor";
    const rows = m.details
      .map(
        (x: any) =>
          `<tr><td>${
            teachers.find((t: any) => t.id === x.plan?.teacher_id)?.name ||
            "Não informado"
          }</td><td>${x.destination || "—"}</td><td>${
            x.payment_method || "—"
          }</td><td>${x.paid_at || "—"}</td><td>${brl(
            Number(x.amount || 0)
          )}</td></tr>`
      )
      .join("");
    const methods = Object.entries(m.paymentMethods)
      .map(([k, v]: any) => `<tr><td>${k}</td><td>${brl(Number(v))}</td></tr>`)
      .join("");
    const teacherRows = m.byTeacher
      .map(
        (x: any) =>
          `<tr><td>${x.teacher.name}</td><td>${x.rows.length}</td><td>${brl(
            x.total
          )}</td><td>${brl(
            x.total * (split.professor_percentage / 100)
          )}</td></tr>`
      )
      .join("");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>Relatório de Fechamento</title><style>body{font-family:Arial,sans-serif;color:#222;padding:32px}h1{margin-bottom:4px}h2{margin-top:28px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:8px;text-align:left}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.card{border:1px solid #ddd;padding:14px;border-radius:8px}.value{font-size:22px;font-weight:bold}.muted{color:#666}@media print{body{padding:0}}</style></head><body><h1>Relatório Completo de Fechamento</h1><p class="muted">Período: ${month} · Responsável: ${title}</p><h2>Resumo financeiro</h2><div class="grid"><div class="card">Mensalidades<div class="value">${brl(
        m.planRevenue
      )}</div></div><div class="card">Aulas avulsas<div class="value">${brl(
        m.extra
      )}</div></div><div class="card">Total recebido<div class="value">${brl(
        m.total
      )}</div></div><div class="card">Parte do professor (${
        split.professor_percentage
      }%)<div class="value">${brl(
        m.teacherShare
      )}</div></div><div class="card">Parte da clínica (${
        split.clinic_percentage
      }%)<div class="value">${brl(m.clinicShare)}</div></div></div><h2>Recebimentos por meio de pagamento</h2><table><thead><tr><th>Meio</th><th>Total</th></tr></thead><tbody>${
        methods || "<tr><td colspan=2>Nenhum recebimento</td></tr>"
      }</tbody></table><h2>Detalhamento de todas as mensalidades recebidas</h2><table><thead><tr><th>Professor</th><th>Destino</th><th>Forma de pagamento</th><th>Data</th><th>Valor</th></tr></thead><tbody>${
        rows || "<tr><td colspan=5>Nenhum recebimento</td></tr>"
      }</tbody></table>${
        teacher === "all"
          ? `<h2>Consolidado por professor</h2><table><thead><tr><th>Professor</th><th>Recebimentos</th><th>Total</th><th>50% do professor</th></tr></thead><tbody>${teacherRows}</tbody></table>`
          : ""
      }<h2>Informações do relatório</h2><p>Este documento consolida exclusivamente os pagamentos marcados como pagos no sistema para o período selecionado, incluindo destino e forma de recebimento.</p><script>window.onload=()=>window.print()</script></body></html>`
    );
    w.document.close();
  };

  const add = async () => {
    if (!teacher || !Number(form.amount)) {
      setError("Selecione o professor e informe o valor.");
      return;
    }
    const { error } = await (supabase as any)
      .from("teacher_financial_entries")
      .insert({
        teacher_id: teacher,
        description: form.description,
        amount: Number(form.amount),
        entry_date: form.entry_date,
        status: "Pago",
      });
    if (error) setError(error.message);
    else {
      setForm({ ...form, amount: "" });
      load();
    }
  };

  if (loading)
    return (
      <div className="py-12 text-center text-sm text-black/45">
        Carregando fechamento...
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 overflow-hidden rounded-3xl border border-black/5 bg-gradient-to-r from-[#0f766e] via-[#115e59] to-[#1f2937] p-7 text-white shadow-[0_18px_40px_-24px_rgba(15,23,42,.7)]">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/60">
          Área financeira
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Fechamentos dos Professores
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/70">
          Divisão automática de {split.professor_percentage}% para a clínica e{" "}
          {split.clinic_percentage}% para o professor, baseada nas receitas
          recebidas.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-medium text-black/50">Professor</label>
            <select
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              className="mt-1 block rounded-xl border border-black/10 px-3 py-2 text-sm"
            >
              <option value="all">Todos os professores</option>
              <option value="">Selecione o professor</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-black/50">Mês de referência</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="mt-1 block rounded-xl border border-black/10 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-black/50">Base do cálculo</label>
            <select
              value={basis}
              onChange={(e) => setBasis(e.target.value as any)}
              className="mt-1 block rounded-xl border border-black/10 px-3 py-2 text-sm"
            >
              <option value="paid_at">Data do pagamento</option>
              <option value="due_date">Vencimento (competência)</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={saveReport}
            disabled={savingReport}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-black/[.03]"
          >
            <Save size={16} />
            {savingReport ? "Salvando..." : "Salvar no histórico"}
          </button>
          <button
            onClick={printReport}
            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-black/80"
          >
            <FileDown size={16} />
            Gerar relatório completo
          </button>
        </div>
      </div>

      <section className="mb-9">
        <SectionTitle
          icon={TrendingUp}
          tone="emerald"
          title="Resumo por destino de pagamento"
        />
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Card
            title="Destino: Professor"
            value={brl(m.destProfessor)}
            icon={UserRoundCheck}
            detail="Total recebido com destino Professor no período"
            accent="sky"
          />
          <Card
            title="Destino: Clínica"
            value={brl(m.destClinica)}
            icon={Landmark}
            detail="Total recebido com destino Clínica no período"
            accent="emerald"
          />
        </div>
      </section>

      <section className="mb-9">
        <SectionTitle
          icon={CircleDollarSign}
          tone="violet"
          title="Receitas do fechamento"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            title="Mensalidades recebidas"
            value={brl(m.planRevenue)}
            icon={CreditCard}
            detail="Pagamentos de planos marcados como pagos"
            accent="violet"
          />
          <Card
            title="Aulas avulsas recebidas"
            value={brl(m.extra)}
            icon={Wallet}
            detail="Entradas extras de aulas avulsas pagas"
            accent="amber"
          />
          <Card
            title={`${split.professor_percentage}% Professor`}
            value={brl(m.teacherShare)}
            icon={UserRoundCheck}
            detail="Parte do professor sobre o total"
            accent="sky"
          />
          <Card
            title={`${split.clinic_percentage}% Clínica`}
            value={brl(m.clinicShare)}
            icon={Landmark}
            detail="Parte da clínica sobre o total"
            accent="emerald"
          />
        </div>
      </section>

      <section className="mb-9">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-500/10 text-slate-600">
              <CalendarDays size={18} />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-black/80">
                Receita total do fechamento
              </h2>
              <p className="text-sm text-black/50">
                O cálculo considera somente receitas marcadas como pagas no
                período selecionado.
              </p>
            </div>
            <p className="ml-auto text-3xl font-bold tracking-tight text-black/85">
              {brl(m.total)}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-9">
        <SectionTitle
          icon={Filter}
          tone="amber"
          title="Recebimentos por meio de pagamento"
          count={Object.keys(m.paymentMethods).length}
        />
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(m.paymentMethods).map(([method, value]: any) => (
              <div
                key={method}
                className="relative overflow-hidden rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-white p-4 transition-transform hover:-translate-y-0.5"
              >
                <span className="absolute inset-x-0 top-0 h-1 bg-amber-500" />
                <div className="text-sm font-medium text-amber-800">{method}</div>
                <strong className="mt-2 block text-xl font-bold tracking-tight text-black/85">
                  {brl(Number(value))}
                </strong>
              </div>
            ))}
            {!Object.keys(m.paymentMethods).length && (
              <div className="col-span-full rounded-xl border border-dashed border-black/15 p-4 text-sm text-black/45">
                Nenhum pagamento recebido no período.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mb-9">
        <SectionTitle
          icon={Users}
          tone="sky"
          title="Detalhamento dos recebimentos"
          count={m.details.length}
        />
        <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-black/10 bg-black/[.04] text-xs font-semibold uppercase tracking-wide text-black/55">
              <tr>
                <th className="p-4">Professor</th>
                <th>Mensalidade</th>
                <th>Destino</th>
                <th>Forma</th>
                <th>Data</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {m.details.map((x: any) => (
                <tr
                  key={x.id}
                  className="border-b border-black/5 transition-colors hover:bg-black/[.02]"
                >
                  <td className="p-4 font-medium">
                    {teachers.find((t) => t.id === x.plan?.teacher_id)?.name ||
                      "Não informado"}
                  </td>
                  <td>{x.description || "Mensalidade"}</td>
                  <td>
                    <span
                      className={
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold " +
                        (x.destination === "Professor"
                          ? "bg-sky-100 text-sky-700 ring-1 ring-sky-200"
                          : x.destination === "Clínica"
                          ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200")
                      }
                    >
                      {x.destination || "—"}
                    </span>
                  </td>
                  <td>{x.payment_method || "—"}</td>
                  <td>{x.paid_at || "—"}</td>
                  <td className="font-medium">
                    {brl(Number(x.amount || 0))}
                  </td>
                </tr>
              ))}
              {!m.details.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-sm text-black/45"
                  >
                    Nenhuma mensalidade recebida no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {teacher === "all" && (
        <section className="mb-9">
          <SectionTitle
            icon={Users}
            tone="violet"
            title="Consolidado por professor"
            count={m.byTeacher.length}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {m.byTeacher.map((x: any) => (
              <div
                key={x.teacher.id}
                className="relative overflow-hidden rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50 to-white p-5 transition-transform hover:-translate-y-0.5"
              >
                <span className="absolute inset-x-0 top-0 h-1 bg-violet-500" />
                <div className="text-sm font-medium text-violet-800">
                  {x.teacher.name}
                </div>
                <strong className="mt-3 block text-2xl font-bold tracking-tight text-black/85">
                  {brl(x.total)}
                </strong>
                <span className="text-xs text-black/45">
                  {x.rows.length} recebimento(s)
                </span>
              </div>
            ))}
            {!m.byTeacher.length && (
              <div className="col-span-full rounded-xl border border-dashed border-black/15 p-4 text-sm text-black/45">
                Nenhum professor com recebimentos no período.
              </div>
            )}
          </div>
        </section>
      )}

      <section className="mb-9">
        <SectionTitle
          icon={Wallet}
          tone="slate"
          title="Adicionar aula avulsa paga"
        />
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Descrição"
              className="rounded-xl border border-black/10 px-3 py-2.5 text-sm"
            />
            <input
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="Valor recebido"
              inputMode="decimal"
              className="rounded-xl border border-black/10 px-3 py-2.5 text-sm"
            />
            <input
              type="date"
              value={form.entry_date}
              onChange={(e) =>
                setForm({ ...form, entry_date: e.target.value })
              }
              className="rounded-xl border border-black/10 px-3 py-2.5 text-sm"
            />
          </div>
          <button
            onClick={add}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-black/80"
          >
            Adicionar ao fechamento
          </button>
        </div>
      </section>
    </div>
  );
}
