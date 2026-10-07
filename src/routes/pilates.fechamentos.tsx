import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { escapeHtml } from "@/lib/escape-html";
import { useDataSync } from "@/hooks/useDataSync";
import { getServiceModuleId } from "@/lib/serviceModule";
import {
  CircleDollarSign,
  Landmark,
  UserRoundCheck,
  Wallet,
  FileDown,
  Save,
  Scale,
  ArrowLeftRight,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/pilates/fechamentos")({
  component: Fechamentos,
});

const brl = (v: number) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const fmtDate = (d?: string | null) =>
  d ? new Intl.DateTimeFormat("pt-BR").format(new Date(d + "T00:00:00")) : "—";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const ACCENTS: Record<
  string,
  { ring: string; bg: string; chip: string; bar: string }
> = {
  sky: {
    ring: "border-gray-200",
    bg: "bg-white",
    chip: "bg-black/[.04] text-black/55",
    bar: "bg-transparent",
  },
  emerald: {
    ring: "border-gray-200",
    bg: "bg-white",
    chip: "bg-black/[.04] text-black/55",
    bar: "bg-transparent",
  },
  violet: {
    ring: "border-gray-200",
    bg: "bg-white",
    chip: "bg-black/[.04] text-black/55",
    bar: "bg-transparent",
  },
  amber: {
    ring: "border-gray-200",
    bg: "bg-white",
    chip: "bg-black/[.04] text-black/55",
    bar: "bg-transparent",
  },
  rose: {
    ring: "border-gray-200",
    bg: "bg-white",
    chip: "bg-black/[.04] text-black/55",
    bar: "bg-transparent",
  },
  slate: {
    ring: "border-gray-200",
    bg: "bg-white",
    chip: "bg-black/[.04] text-black/55",
    bar: "bg-transparent",
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
  const a = ACCENTS[accent] ?? ACCENTS["sky"]!;
  return (
    <div
      className={
        "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 " +
        a.ring +
        " " +
        a.bg
      }
    >
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

type Row = {
  key: string;
  date: string | null;
  student: string;
  type: string;
  amount: number;
  destination: string;
  method: string | null;
  teacher_id: string | null;
};

function Fechamentos() {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [monthNum, setMonthNum] = useState(
    String(now.getMonth() + 1).padStart(2, "0")
  );
  const [teacher, setTeacher] = useState("all");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [planCatalog, setPlanCatalog] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [split, setSplit] = useState({
    professor_percentage: 50,
    clinic_percentage: 50,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingReport, setSavingReport] = useState(false);

  const month = `${year}-${monthNum}`;

  const load = async () => {
    const db = supabase as any;
    const moduleId = await getServiceModuleId("pilates");
    if (!moduleId) { setError("Módulo Pilates não configurado."); return; }
    const [t, sp, p, st, planRef, pl, e, fs] = await Promise.all([
      db.from("teachers").select("*").eq("module_id", moduleId).order("name"),
      db.from("student_plans").select("*").eq("module_id", moduleId),
      db.from("student_payments").select("*").eq("module_id", moduleId),
      db.from("students").select("id,full_name,active,updated_at").eq("module_id", moduleId),
      db.from("plans").select("id,name").eq("module_id", moduleId),
      db.from("private_lesson_students").select("*").eq("module_id", moduleId),
      db.from("teacher_financial_entries").select("*").eq("module_id", moduleId),
      db.from("financial_split_settings").select("*").eq("module_id", moduleId).limit(1).maybeSingle(),
    ]);
    const err = [t, sp, p, st, planRef, pl, e, fs].find((x: any) => x?.error);
    setError(err ? err.error.message : "");
    setTeachers(t.data || []);
    setPlans(sp.data || []);
    setPayments(p.data || []);
    setStudents(st.data || []);
    setPlanCatalog(planRef.data || []);
    setLessons(pl.data || []);
    setEntries(e.data || []);
    if (fs.data)
      setSplit({
        professor_percentage: Number(fs.data.professor_percentage) || 50,
        clinic_percentage: Number(fs.data.clinic_percentage) || 50,
      });
    setLoading(false);
  };

  useDataSync(load);

  const m = useMemo(() => {
    const studentName = (id: string) =>
      students.find((s: any) => s.id === id)?.full_name || "Aluno";
    const inMonth = (d?: string | null) => !!d && d.slice(0, 7) === month;
    const norm = (d?: string | null) =>
      d === "Professor" ? "Professor" : "Clínica";
    const isPaid = (s?: string | null) =>
      ["pago", "recebido", "pago parcial"].includes(
        String(s || "").toLowerCase()
      );

    const rows: Row[] = [];

    // 1. Mensalidades / planos / parcelas efetivamente pagas
    payments.forEach((x: any) => {
      if (!isPaid(x.status)) return;
      const date = x.paid_at || x.due_date;
      if (!inMonth(date)) return;
      const plan = plans.find((p: any) => p.id === x.plan_id);
      rows.push({
        key: "sp-" + x.id,
        date,
        student: studentName(x.student_id),
        type: String(x.status).toLowerCase().includes("parcial")
          ? "Parcela"
          : "Mensalidade",
        amount: Number(x.amount || 0),
        destination: norm(x.destination),
        method: x.payment_method || null,
        teacher_id: plan?.teacher_id || null,
      });
    });

    // 2. Aulas avulsas pagas
    lessons.forEach((x: any) => {
      if (!x.paid) return;
      const date = x.paid_at || x.lesson_date;
      if (!inMonth(date)) return;
      rows.push({
        key: "pl-" + x.id,
        date,
        student: x.full_name,
        type: "Aula avulsa",
        amount: Number(x.lesson_value || 0),
        destination: norm(x.destination),
        method: x.payment_method || null,
        teacher_id: x.teacher_id || null,
      });
    });

    // 3. Outros recebimentos lançados manualmente
    entries.forEach((x: any) => {
      if (!isPaid(x.status)) return;
      if (!inMonth(x.entry_date)) return;
      rows.push({
        key: "fe-" + x.id,
        date: x.entry_date,
        student: x.description || "Lançamento",
        type: /avuls/i.test(x.description || "") ? "Aula avulsa" : "Outros",
        amount: Number(x.amount || 0),
        destination: norm(x.destination),
        method: null,
        teacher_id: x.teacher_id || null,
      });
    });

    const filtered = (
      teacher === "all" ? rows : rows.filter((r) => r.teacher_id === teacher)
    ).sort((a, b) => String(a.date).localeCompare(String(b.date)));

    const sum = (list: Row[]) => list.reduce((a, x) => a + x.amount, 0);
    const total = sum(filtered);
    const receivedProfessor = sum(
      filtered.filter((r) => r.destination === "Professor")
    );
    const receivedClinic = sum(
      filtered.filter((r) => r.destination === "Clínica")
    );
    const shareProfessor = total * (split.professor_percentage / 100);
    const shareClinic = total * (split.clinic_percentage / 100);
    const balanceProfessor = receivedProfessor - shareProfessor;
    const balanceClinic = receivedClinic - shareClinic;
    const adjustment = Math.abs(balanceProfessor);
    const status: "equal" | "professor" | "clinic" =
      Math.round(adjustment * 100) === 0
        ? "equal"
        : balanceProfessor > 0
        ? "professor"
        : "clinic";

    const planName = (planId: string | null | undefined) =>
      planCatalog.find((p: any) => p.id === planId)?.name || "Sem plano";

    const addedStudents = teacher === "all" ? [] : plans
      .filter((p: any) => p.teacher_id === teacher && p.start_date && p.start_date.slice(0, 7) === month)
      .map((p: any) => {
        const student = students.find((s: any) => s.id === p.student_id);
        return { id: `add-${p.id}`, student: student?.full_name || "Aluno", plan: planName(p.plan_id), amount: Number(p.monthly_value || 0), date: p.start_date };
      });

    const deactivatedStudents = teacher === "all" ? [] : students
      .filter((s: any) => !s.active && s.updated_at && String(s.updated_at).slice(0, 7) === month)
      .map((s: any) => {
        const studentPlans = plans.filter((p: any) => p.student_id === s.id && p.teacher_id === teacher)
          .sort((a: any, b: any) => String(b.start_date || "").localeCompare(String(a.start_date || "")));
        const p = studentPlans[0];
        if (!p) return null;
        return { id: `out-${s.id}`, student: s.full_name || "Aluno", plan: planName(p.plan_id), amount: Number(p.monthly_value || 0), date: String(s.updated_at).slice(0, 10) };
      }).filter(Boolean);

    const byType = filtered.reduce<Record<string, number>>((acc, x) => {
      acc[x.type] = (acc[x.type] || 0) + x.amount;
      return acc;
    }, {});

    return {
      rows: filtered,
      addedStudents,
      deactivatedStudents,
      total,
      receivedProfessor,
      receivedClinic,
      shareProfessor,
      shareClinic,
      balanceProfessor,
      balanceClinic,
      adjustment,
      status,
      byType,
    };
  }, [payments, lessons, entries, plans, students, planCatalog, month, teacher, split]);

  const teacherName =
    teacher === "all"
      ? "Todos os professores"
      : teachers.find((t: any) => t.id === teacher)?.name || "Professor";

  const statusUi =
    m.status === "equal"
      ? {
          label: "Fechamento equilibrado",
          detail: "Nenhum valor a repassar neste período.",
          box: "border-gray-200 bg-white",
          bar: "bg-transparent",
          text: "text-black/70",
          icon: CheckCircle2,
        }
      : m.status === "professor"
      ? {
          label: `Professor deve repassar ${brl(m.adjustment)} para a Clínica`,
          detail: "O professor recebeu acima da cota de 50%.",
          box: "border-gray-200 bg-white",
          bar: "bg-transparent",
          text: "text-black/70",
          icon: ArrowLeftRight,
        }
      : {
          label: `Clínica deve repassar ${brl(m.adjustment)} para o Professor`,
          detail: "A clínica recebeu acima da cota de 50%.",
          box: "border-gray-200 bg-white",
          bar: "bg-transparent",
          text: "text-black/70",
          icon: ArrowLeftRight,
        };

  const saveReport = async () => {
    setSavingReport(true);
    setError("");
    const moduleId = await getServiceModuleId("pilates");
    if (!moduleId) { setError("Módulo Pilates não configurado."); setSavingReport(false); return; }
    const { error } = await (supabase as any)
      .from("teacher_financial_reports")
      .insert({
        module_id: moduleId,
        month,
        teacher_id: teacher === "all" ? null : teacher,
        teacher_name: teacherName,
        total: m.total,
        snapshot: {
          month,
          teacher_name: teacherName,
          total: m.total,
          receivedProfessor: m.receivedProfessor,
          receivedClinic: m.receivedClinic,
          shareProfessor: m.shareProfessor,
          shareClinic: m.shareClinic,
          adjustment: m.adjustment,
          status: statusUi.label,
          rows: m.rows,
          addedStudents: m.addedStudents,
          deactivatedStudents: m.deactivatedStudents,
        },
      });
    if (error) setError(error.message);
    else alert("Fechamento salvo no histórico.");
    setSavingReport(false);
  };

  const printReport = () => {
    const e = escapeHtml;
    const generatedAt = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date());

    const periodLabel = `${MONTHS[Number(monthNum) - 1]} de ${year}`;
    const statusLabel =
      m.status === "equal"
        ? "Fechamento equilibrado"
        : m.status === "professor"
        ? `Professor deve repassar ${brl(m.adjustment)} para a Clínica`
        : `Clínica deve repassar ${brl(m.adjustment)} para o Professor`;

    const statusDetail =
      m.status === "equal"
        ? "Os valores recebidos estão alinhados com a divisão configurada."
        : `Diferença identificada de ${brl(m.adjustment)} para equalização do fechamento.`;

    const rows = m.rows
      .map(
        (x) =>
          `<tr>
            <td class="c">${e(fmtDate(x.date))}</td>
            <td><strong>${e(x.student)}</strong></td>
            <td>${e(x.type)}</td>
            <td>${e(x.method || "—")}</td>
            <td class="r">${e(brl(x.amount))}</td>
            <td>${e(x.destination)}</td>
          </tr>`
      )
      .join("");

    const compositionRows = Object.entries(m.byType)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(
        ([type, value]) =>
          `<tr><td>${e(type)}</td><td class="r">${e(brl(value))}</td></tr>`
      )
      .join("");

    const addedStudentRows = m.addedStudents.map((x: any) =>
      `<tr><td class="c">${e(fmtDate(x.date))}</td><td><strong>${e(x.student)}</strong></td><td>${e(x.plan)}</td><td class="r">${e(brl(x.amount))}</td></tr>`
    ).join("");

    const deactivatedStudentRows = m.deactivatedStudents.map((x: any) =>
      `<tr><td class="c">${e(fmtDate(x.date))}</td><td><strong>${e(x.student)}</strong></td><td>${e(x.plan)}</td><td class="r">${e(brl(x.amount))}</td></tr>`
    ).join("");

    const w = window.open("", "_blank");
    if (!w) return;

    w.document.open();
    w.document.write(
      `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Fechamento Pilates - ${e(teacherName)} - ${e(periodLabel)}</title>
<style>
:root{--bg:#f6f1ef;--panel:#fff;--ink:#3a2a27;--muted:#777;--line:#e3c6bf;--head:#c98072;--title:#8b5048;--alt:#f8eeeb}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:Helvetica,Arial,sans-serif;font-size:15px}
.wrap{max-width:820px;margin:0 auto;padding:16px}
.paper{background:#fff;color:#222;border:1px solid var(--line);border-radius:4px;padding:26px 22px;max-width:100%}
.paper img{display:block;margin:0 auto 12px;width:72px;height:72px}
.paper h1{text-align:center;color:var(--title);font-size:18px;margin:0 0 6px}
.paper .sub{text-align:center;color:#666;font-size:12.5px;margin-bottom:16px}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px}
.meta div{border:1px solid var(--line);background:var(--alt);padding:8px 10px}
.meta span{display:block;color:#777;font-size:10px;text-transform:uppercase;letter-spacing:.05em}
.meta strong{display:block;margin-top:3px;font-size:12px;color:var(--ink)}
.scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:var(--head);color:#fff;text-align:left;padding:7px 9px}
td{border:1px solid var(--line);padding:7px 9px}
tbody tr:nth-child(even){background:var(--alt)}
.c{text-align:center}.r{text-align:right;white-space:nowrap}
.section{margin-top:20px}
.section-title{color:var(--title);font-size:14px;font-weight:bold;margin:0 0 8px}
.summary{margin-top:20px}
.summary th{font-size:13px}
.summary tr.final td{background:var(--alt);font-weight:bold}
.summary tr.highlight td{background:var(--alt);font-weight:bold}
.status{margin-top:20px;padding:10px 12px;border:1px solid var(--line);background:var(--alt);font-size:12px}
.status strong{color:var(--title)}
.note{font-size:11.5px;color:#555;margin-top:10px}
.footer{display:flex;justify-content:space-between;gap:12px;margin-top:18px;padding-top:10px;border-top:1px solid var(--line);font-size:9px;color:#777}
@media print{body{background:#fff}.wrap{padding:0;max-width:none}.paper{border:0;padding:0}th,tr,td{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4;margin:12mm}}
</style>
</head>
<body>
<div class="wrap">
<div class="paper" id="paper">
<img src="/__l5e/assets-v1/6c7fcdfc-705e-4b26-9799-c2d14e1fe6ae/logo-equilibre.png" alt="Espaço Equilibre">
<h1>FECHAMENTO FINANCEIRO - PILATES</h1>
<div class="sub">Competência: ${e(periodLabel)} | ${e(teacherName)}</div>

<div class="meta">
  <div><span>Período</span><strong>${e(periodLabel)}</strong></div>
  <div><span>Gerado em</span><strong>${e(generatedAt)}</strong></div>
</div>

<div class="scroll">
<table>
<thead><tr><th>Indicador</th><th class="r">Valor</th></tr></thead>
<tbody>
<tr><td>Total efetivamente recebido</td><td class="r">${e(brl(m.total))}</td></tr>
<tr><td>Professor recebeu</td><td class="r">${e(brl(m.receivedProfessor))}</td></tr>
<tr><td>Clínica recebeu</td><td class="r">${e(brl(m.receivedClinic))}</td></tr>
<tr class="highlight"><td>Total de lançamentos</td><td class="r">${e(String(m.rows.length))}</td></tr>
</tbody>
</table>
</div>

<div class="section">
<div class="section-title">Divisão financeira</div>
<div class="scroll">
<table>
<thead><tr><th>Destino</th><th>Percentual</th><th class="r">Valor da cota</th><th class="r">Recebido</th></tr></thead>
<tbody>
<tr><td>Professor</td><td>${e(String(split.professor_percentage))}%</td><td class="r">${e(brl(m.shareProfessor))}</td><td class="r">${e(brl(m.receivedProfessor))}</td></tr>
<tr><td>Clínica</td><td>${e(String(split.clinic_percentage))}%</td><td class="r">${e(brl(m.shareClinic))}</td><td class="r">${e(brl(m.receivedClinic))}</td></tr>
</tbody>
</table>
</div>
</div>

<div class="section">
<div class="section-title">Composição dos recebimentos</div>
<div class="scroll">
<table>
<thead><tr><th>Tipo</th><th class="r">Valor</th></tr></thead>
<tbody>${compositionRows || '<tr><td colspan="2">Nenhum recebimento no período.</td></tr>'}</tbody>
</table>
</div>
</div>

<div class="status">
<strong>Status:</strong> ${e(statusLabel)}<br>
${e(statusDetail)}
</div>

<div class="section">
<div class="section-title">Entradas de alunos no período</div>
<div class="scroll">
<table>
<thead><tr><th class="c">Data</th><th>Aluno</th><th>Plano</th><th class="r">Valor</th></tr></thead>
<tbody>${addedStudentRows || '<tr><td colspan="4" class="c">Nenhum aluno adicionado no período para o professor selecionado.</td></tr>'}</tbody>
</table>
</div>
</div>

<div class="section">
<div class="section-title">Saídas de alunos no período</div>
<div class="scroll">
<table>
<thead><tr><th class="c">Data</th><th>Aluno</th><th>Plano</th><th class="r">Valor</th></tr></thead>
<tbody>${deactivatedStudentRows || '<tr><td colspan="4" class="c">Nenhum aluno desativado no período para o professor selecionado.</td></tr>'}</tbody>
</table>
</div>
</div>

<div class="section">
<div class="section-title">Detalhamento dos recebimentos</div>
<div class="scroll">
<table>
<thead><tr><th class="c" style="width:80px">Data</th><th>Aluno / descrição</th><th>Tipo</th><th>Forma</th><th class="r">Valor</th><th>Destino</th></tr></thead>
<tbody>${rows || '<tr><td colspan="6" class="c">Nenhum recebimento no período selecionado.</td></tr>'}</tbody>
${m.rows.length ? `<tfoot><tr><td colspan="4"><strong>Total recebido</strong></td><td class="r"><strong>${e(brl(m.total))}</strong></td><td></td></tr></tfoot>` : ""}
</table>
</div>
</div>

<div class="footer">
<span>Espaço Equilibre · Pilates</span>
<span>Documento gerado pelo sistema</span>
</div>
</div>
</div>
<script>
window.onload=()=>setTimeout(()=>window.print(),180);
</script>
</body>
</html>`
    );
    w.document.close();
  };
  if (loading)
    return (
      <div className="w-full max-w-none p-2 text-sm text-black/50">
        Carregando fechamento...
      </div>
    );

  const years = Array.from(
    new Set([
      String(now.getFullYear() - 1),
      String(now.getFullYear()),
      String(now.getFullYear() + 1),
      year,
    ])
  ).sort();

  return (
    <div className="w-full max-w-none">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/60">
          Pilates
        </p>
        <h1 className="mt-1 text-[30px] font-bold leading-[1.2] tracking-[-0.02em] text-[#111827]">Fechamento</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/70">
          Divisão automática 50% / 50% sobre tudo que foi efetivamente recebido
          no período — mensalidades, parcelas, planos e aulas avulsas pagas.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-7 flex flex-wrap items-end gap-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div>
          <label className="text-xs font-medium text-black/50">Mês</label>
          <select
            value={monthNum}
            onChange={(e) => setMonthNum(e.target.value)}
            className="mt-1 block rounded-xl border border-black/10 px-3 py-2 text-sm"
          >
            {MONTHS.map((name, i) => (
              <option key={name} value={String(i + 1).padStart(2, "0")}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-black/50">Ano</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="mt-1 block rounded-xl border border-black/10 px-3 py-2 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-black/50">Professor</label>
          <select
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
            className="mt-1 block rounded-xl border border-black/10 px-3 py-2 text-sm"
          >
            <option value="all">Todos os professores</option>
            {teachers.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex flex-wrap gap-3">
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
            Gerar relatório
          </button>
        </div>
      </div>

      <section className="mb-8">
        <SectionTitle title="Indicadores do período" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            title="Total recebido"
            value={brl(m.total)}
            icon={CircleDollarSign}
            detail="Somente pagamentos efetivamente recebidos"
            accent="violet"
          />
          <Card
            title="Professor recebeu"
            value={brl(m.receivedProfessor)}
            icon={UserRoundCheck}
            detail="Recebimentos com destino Professor"
            accent="sky"
          />
          <Card
            title="Clínica recebeu"
            value={brl(m.receivedClinic)}
            icon={Landmark}
            detail="Recebimentos com destino Clínica"
            accent="emerald"
          />
          <Card
            title={`Cota do professor — ${split.professor_percentage}%`}
            value={brl(m.shareProfessor)}
            icon={Scale}
            detail="Valor que o professor deve ficar"
            accent="sky"
          />
          <Card
            title={`Cota da clínica — ${split.clinic_percentage}%`}
            value={brl(m.shareClinic)}
            icon={Scale}
            detail="Valor que a clínica deve ficar"
            accent="emerald"
          />
          <Card
            title="Ajuste"
            value={brl(m.adjustment)}
            icon={ArrowLeftRight}
            detail="Diferença necessária para equalizar"
            accent={m.status === "equal" ? "slate" : "amber"}
          />
        </div>
      </section>

      <section className="mb-8">
        <div
          className={
            "relative overflow-hidden rounded-2xl border p-6 " +
            statusUi.box
          }
        >
          <div className="flex items-center gap-4">
            <span
              className={
                "flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 " +
                statusUi.text
              }
            >
              <statusUi.icon size={22} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-black/45">
                Status do fechamento
              </p>
              <h2
                className={
                  "mt-1 text-xl font-bold tracking-tight " + statusUi.text
                }
              >
                {statusUi.label}
              </h2>
              <p className="mt-1 text-sm text-black/55">{statusUi.detail}</p>
            </div>
            <div className="ml-auto hidden text-right sm:block">
              <p className="text-xs font-semibold uppercase tracking-wide text-black/45">
                Saldo professor
              </p>
              <p className="text-lg font-bold text-black/80">
                {brl(m.balanceProfessor)}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-black/45">
                Saldo clínica
              </p>
              <p className="text-lg font-bold text-black/80">
                {brl(m.balanceClinic)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <SectionTitle title="Composição por tipo de recebimento" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(m.byType).map(([type, value]) => (
            <div
              key={type}
              className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="text-sm font-medium text-black/65">{type}</div>
              <strong className="mt-2 block text-xl font-bold tracking-tight text-black/85">
                {brl(value)}
              </strong>
            </div>
          ))}
          {!Object.keys(m.byType).length && (
            <div className="col-span-full rounded-xl border border-dashed border-black/15 p-4 text-sm text-black/45">
              Nenhum pagamento recebido no período.
            </div>
          )}
        </div>
      </section>

      <section className="mb-10">
        <SectionTitle title="Detalhamento do fechamento" count={m.rows.length} />
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-black/10 bg-black/[.04] text-xs font-semibold uppercase tracking-wide text-black/55">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Aluno</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Forma</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Recebido por</th>
              </tr>
            </thead>
            <tbody>
              {m.rows.map((x) => (
                <tr
                  key={x.key}
                  className="border-b border-black/5 transition-colors hover:bg-black/[.02]"
                >
                  <td className="p-4">{fmtDate(x.date)}</td>
                  <td className="p-4 font-medium">{x.student}</td>
                  <td className="p-4">{x.type}</td>
                  <td className="p-4">{x.method || "—"}</td>
                  <td className="p-4 font-semibold">{brl(x.amount)}</td>
                  <td className="p-4">
                    <span
                      className={
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold " +
                        (x.destination === "Professor"
                          ? "bg-black/[.04] text-black/60 ring-1 ring-black/10"
                          : "bg-black/[.04] text-black/60 ring-1 ring-black/10")
                      }
                    >
                      {x.destination}
                    </span>
                  </td>
                </tr>
              ))}
              {!m.rows.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-sm text-black/45"
                  >
                    Nenhum recebimento no período selecionado.
                  </td>
                </tr>
              )}
            </tbody>
            {!!m.rows.length && (
              <tfoot>
                <tr className="bg-black/[.03] font-semibold">
                  <td className="p-4" colSpan={4}>
                    Total recebido
                  </td>
                  <td className="p-4">{brl(m.total)}</td>
                  <td className="p-4">
                    <Wallet size={16} className="text-black/40" />
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
