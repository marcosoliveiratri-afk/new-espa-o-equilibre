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
    const [t, sp, p, st, pl, e, fs] = await Promise.all([
      db.from("teachers").select("*").eq("module_id", moduleId).order("name"),
      db.from("student_plans").select("*").eq("module_id", moduleId),
      db.from("student_payments").select("*").eq("module_id", moduleId),
      db.from("students").select("id,full_name").eq("module_id", moduleId),
      db.from("private_lesson_students").select("*").eq("module_id", moduleId),
      db.from("teacher_financial_entries").select("*").eq("module_id", moduleId),
      db.from("financial_split_settings").select("*").eq("module_id", moduleId).limit(1).maybeSingle(),
    ]);
    const err = [t, sp, p, st, pl, e, fs].find((x: any) => x?.error);
    setError(err ? err.error.message : "");
    setTeachers(t.data || []);
    setPlans(sp.data || []);
    setPayments(p.data || []);
    setStudents(st.data || []);
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

    const byType = filtered.reduce<Record<string, number>>((acc, x) => {
      acc[x.type] = (acc[x.type] || 0) + x.amount;
      return acc;
    }, {});

    return {
      rows: filtered,
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
  }, [payments, lessons, entries, plans, students, month, teacher, split]);

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

    const statusTone =
      m.status === "equal"
        ? { bg: "#ECFDF3", border: "#BBF7D0", text: "#166534", dot: "#16A34A" }
        : { bg: "#FFF7ED", border: "#FED7AA", text: "#9A3412", dot: "#EA580C" };

    const typeRows = Object.entries(m.byType)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(
        ([type, value]) =>
          `<div class="mini-row"><span>${e(type)}</span><strong>${e(
            brl(value)
          )}</strong></div>`
      )
      .join("");

    const rows = m.rows
      .map(
        (x) =>
          `<tr>
            <td>${e(fmtDate(x.date))}</td>
            <td><strong>${e(x.student)}</strong></td>
            <td>${e(x.type)}</td>
            <td>${e(x.method || "—")}</td>
            <td class="money">${e(brl(x.amount))}</td>
            <td><span class="tag">${e(x.destination)}</span></td>
          </tr>`
      )
      .join("");

    const w = window.open("", "_blank");
    if (!w) return;

    w.document.write(
      `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fechamento Financeiro — ${e(periodLabel)}</title>
<style>
  @page { size: A4; margin: 14mm 12mm 16mm; }

  :root {
    --ink: #111827;
    --muted: #64748b;
    --soft: #f8fafc;
    --line: #e5e7eb;
    --dark: #111827;
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: var(--ink);
    background: #fff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
    font-size: 11px;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .report { max-width: 900px; margin: 0 auto; }

  .top {
    display: flex;
    justify-content: space-between;
    gap: 28px;
    align-items: flex-start;
    padding-bottom: 20px;
    border-bottom: 2px solid var(--ink);
  }

  .brand {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: .16em;
    text-transform: uppercase;
    color: #475569;
    margin-bottom: 7px;
  }

  h1 {
    margin: 0;
    font-size: 27px;
    line-height: 1.08;
    letter-spacing: -.035em;
  }

  .subtitle {
    margin: 7px 0 0;
    color: var(--muted);
    font-size: 12px;
  }

  .meta {
    min-width: 210px;
    text-align: right;
  }

  .meta-label {
    display: block;
    color: #94a3b8;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .12em;
    text-transform: uppercase;
    margin-bottom: 3px;
  }

  .meta-value {
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 10px;
  }

  .hero {
    margin-top: 20px;
    padding: 18px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--soft);
  }

  .hero-label {
    color: var(--muted);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .12em;
    text-transform: uppercase;
  }

  .hero-value {
    margin-top: 4px;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -.03em;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: 1.25fr 1fr 1fr;
    gap: 10px;
    margin-top: 12px;
  }

  .metric {
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 11px;
    background: #fff;
  }

  .metric-label {
    color: var(--muted);
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
  }

  .metric-value {
    margin-top: 5px;
    font-size: 16px;
    font-weight: 800;
  }

  .section { margin-top: 22px; }
  .section-title {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 9px;
  }

  h2 {
    margin: 0;
    font-size: 13px;
    letter-spacing: -.01em;
  }

  .section-note {
    color: #94a3b8;
    font-size: 9px;
  }

  .split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .split-card {
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: 11px;
    background: #fff;
  }

  .split-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    color: #475569;
    font-size: 10px;
    font-weight: 700;
  }

  .split-value {
    margin-top: 6px;
    font-size: 20px;
    font-weight: 800;
  }

  .split-detail {
    margin-top: 4px;
    color: var(--muted);
    font-size: 9px;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 13px 14px;
    border: 1px solid ${statusTone.border};
    border-radius: 11px;
    background: ${statusTone.bg};
    color: ${statusTone.text};
  }

  .status-dot {
    width: 9px;
    height: 9px;
    flex: 0 0 9px;
    border-radius: 50%;
    background: ${statusTone.dot};
  }

  .status-title { font-size: 11px; font-weight: 800; }
  .status-detail { margin-top: 2px; font-size: 9px; opacity: .86; }

  .composition {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .mini {
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: #fff;
  }

  .mini-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }

  .mini-row:last-child { border-bottom: 0; }

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 11px;
    font-size: 9.5px;
  }

  thead th {
    padding: 9px 10px;
    background: #f8fafc;
    color: #475569;
    border-bottom: 1px solid var(--line);
    text-align: left;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: .06em;
    text-transform: uppercase;
  }

  tbody td {
    padding: 9px 10px;
    border-bottom: 1px solid #eef2f7;
    vertical-align: middle;
  }

  tbody tr:last-child td { border-bottom: 0; }
  .money { text-align: right; font-weight: 800; white-space: nowrap; }
  .tag {
    display: inline-block;
    padding: 3px 7px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: #f8fafc;
    color: #475569;
    font-size: 8px;
    font-weight: 700;
  }

  tfoot td {
    padding: 10px;
    background: #f8fafc;
    border-top: 1px solid var(--line);
    font-weight: 800;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-top: 22px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
    color: #94a3b8;
    font-size: 8px;
  }

  .empty {
    padding: 18px;
    text-align: center;
    color: var(--muted);
  }

  .avoid-break { break-inside: avoid; page-break-inside: avoid; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; page-break-inside: avoid; }

  @media print {
    .report { max-width: none; }
  }

  @media (max-width: 700px) {
    .top, .hero-grid, .split, .composition { grid-template-columns: 1fr; }
    .top { display: block; }
    .meta { margin-top: 14px; text-align: left; }
    .composition { display: grid; }
  }
</style>
</head>
<body>
<main class="report">
  <header class="top">
    <div>
      <div class="brand">Espaço Equilibre · Pilates</div>
      <h1>Fechamento financeiro</h1>
      <p class="subtitle">${e(periodLabel)} · ${e(teacherName)}</p>
    </div>
    <div class="meta">
      <span class="meta-label">Relatório</span>
      <div class="meta-value">${e(month)}</div>
      <span class="meta-label">Gerado em</span>
      <div class="meta-value">${e(generatedAt)}</div>
    </div>
  </header>

  <section class="hero avoid-break">
    <div class="hero-label">Total efetivamente recebido</div>
    <div class="hero-value">${e(brl(m.total))}</div>
    <div class="hero-grid">
      <div class="metric">
        <div class="metric-label">Professor recebeu</div>
        <div class="metric-value">${e(brl(m.receivedProfessor))}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Clínica recebeu</div>
        <div class="metric-value">${e(brl(m.receivedClinic))}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Lançamentos</div>
        <div class="metric-value">${e(String(m.rows.length))}</div>
      </div>
    </div>
  </section>

  <section class="section avoid-break">
    <div class="section-title">
      <h2>Divisão financeira</h2>
      <span class="section-note">Percentuais configurados para o período</span>
    </div>
    <div class="split">
      <div class="split-card">
        <div class="split-head">
          <span>Professor · ${e(String(split.professor_percentage))}%</span>
          <span>Recebido: ${e(brl(m.receivedProfessor))}</span>
        </div>
        <div class="split-value">${e(brl(m.shareProfessor))}</div>
        <div class="split-detail">Cota prevista do professor no fechamento.</div>
      </div>
      <div class="split-card">
        <div class="split-head">
          <span>Clínica · ${e(String(split.clinic_percentage))}%</span>
          <span>Recebido: ${e(brl(m.receivedClinic))}</span>
        </div>
        <div class="split-value">${e(brl(m.shareClinic))}</div>
        <div class="split-detail">Cota prevista da clínica no fechamento.</div>
      </div>
    </div>
  </section>

  <section class="section avoid-break">
    <div class="section-title"><h2>Status do fechamento</h2></div>
    <div class="status">
      <span class="status-dot"></span>
      <div>
        <div class="status-title">${e(statusLabel)}</div>
        <div class="status-detail">${e(statusDetail)}</div>
      </div>
    </div>
  </section>

  <section class="section avoid-break">
    <div class="section-title">
      <h2>Composição dos recebimentos</h2>
      <span class="section-note">${e(brl(m.total))} no período</span>
    </div>
    <div class="mini">
      ${typeRows || '<div class="empty">Nenhum recebimento no período.</div>'}
    </div>
  </section>

  <section class="section">
    <div class="section-title">
      <h2>Detalhamento dos recebimentos</h2>
      <span class="section-note">${e(String(m.rows.length))} lançamento(s)</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Aluno / descrição</th>
          <th>Tipo</th>
          <th>Forma</th>
          <th style="text-align:right">Valor</th>
          <th>Destino</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="6" class="empty">Nenhum recebimento no período selecionado.</td></tr>'}
      </tbody>
      ${m.rows.length ? `<tfoot><tr><td colspan="4">Total recebido</td><td class="money">${e(brl(m.total))}</td><td></td></tr></tfoot>` : ""}
    </table>
  </section>

  <footer class="footer">
    <span>Espaço Equilibre · Fechamento financeiro</span>
    <span>Documento gerado pelo sistema</span>
  </footer>
</main>
<script>
  window.onload = () => {
    setTimeout(() => window.print(), 180);
  };
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
