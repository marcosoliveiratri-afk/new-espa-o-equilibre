import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileDown, Save, CheckCircle2, ArrowLeftRight } from "lucide-react";

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
    const [t, sp, p, st, pl, e, fs] = await Promise.all([
      db.from("teachers").select("*").order("name"),
      db.from("student_plans").select("*"),
      db.from("student_payments").select("*"),
      db.from("students").select("id,full_name"),
      db.from("private_lesson_students").select("*"),
      db.from("teacher_financial_entries").select("*"),
      db.from("financial_split_settings").select("*").limit(1).maybeSingle(),
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

  useEffect(() => {
    load();
    const ch = supabase.channel("fechamentos-realtime");
    [
      "student_payments",
      "student_plans",
      "private_lesson_students",
      "teacher_financial_entries",
      "financial_split_settings",
    ].forEach((table) =>
      ch.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => void load()
      )
    );
    ch.subscribe();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      supabase.removeChannel(ch);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

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
          text: "text-emerald-700",
          icon: CheckCircle2,
        }
      : m.status === "professor"
      ? {
          label: `Professor deve repassar ${brl(m.adjustment)} para a Clínica`,
          detail: "O professor recebeu acima da cota de 50%.",
          text: "text-amber-700",
          icon: ArrowLeftRight,
        }
      : {
          label: `Clínica deve repassar ${brl(m.adjustment)} para o Professor`,
          detail: "A clínica recebeu acima da cota de 50%.",
          text: "text-sky-700",
          icon: ArrowLeftRight,
        };

  const saveReport = async () => {
    setSavingReport(true);
    setError("");
    const { error } = await (supabase as any)
      .from("teacher_financial_reports")
      .insert({
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
    const rows = m.rows
      .map(
        (x) =>
          `<tr><td>${fmtDate(x.date)}</td><td>${x.student}</td><td>${
            x.type
          }</td><td>${brl(x.amount)}</td><td>${x.destination}</td></tr>`
      )
      .join("");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>Fechamento ${month}</title><style>body{font-family:Arial,sans-serif;color:#222;padding:32px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:8px;text-align:left}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:12px}.card{border:1px solid #ddd;padding:14px;border-radius:8px}.value{font-size:20px;font-weight:bold}</style></head><body>` +
        `<h1>Fechamento — ${MONTHS[Number(monthNum) - 1]}/${year}</h1><p>${teacherName}</p>` +
        `<div class="grid"><div class="card">Total recebido<div class="value">${brl(
          m.total
        )}</div></div><div class="card">Professor recebeu<div class="value">${brl(
          m.receivedProfessor
        )}</div></div><div class="card">Clínica recebeu<div class="value">${brl(
          m.receivedClinic
        )}</div></div><div class="card">Cota do professor (50%)<div class="value">${brl(
          m.shareProfessor
        )}</div></div><div class="card">Cota da clínica (50%)<div class="value">${brl(
          m.shareClinic
        )}</div></div><div class="card">Ajuste<div class="value">${brl(
          m.adjustment
        )}</div></div></div>` +
        `<h2>${statusUi.label}</h2>` +
        `<h2>Detalhamento</h2><table><thead><tr><th>Data</th><th>Aluno</th><th>Tipo</th><th>Valor</th><th>Recebido por</th></tr></thead><tbody>${
          rows || "<tr><td colspan=5>Nenhum recebimento no período</td></tr>"
        }</tbody></table>` +
        `<script>window.onload=()=>window.print()</script></body></html>`
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
      <div className="mb-8">
        <p className="text-sm font-medium text-black/45">Pilates</p>
        <h1 className="mt-1 text-3xl font-semibold">Fechamento</h1>
        <p className="mt-2 text-sm text-black/55">
          Divisão automática 50% / 50% sobre tudo que foi efetivamente recebido
          no período — mensalidades, parcelas, planos e aulas avulsas pagas.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-7 flex flex-wrap items-end gap-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-black/45">Total recebido</p>
            <p className="mt-1 text-2xl font-bold">{brl(m.total)}</p>
            <p className="text-xs text-black/40">
              Somente pagamentos efetivamente recebidos
            </p>
          </div>
          <div>
            <p className="text-xs text-black/45">Professor recebeu</p>
            <p className="mt-1 text-2xl font-bold">{brl(m.receivedProfessor)}</p>
            <p className="text-xs text-black/40">
              Recebimentos com destino Professor
            </p>
          </div>
          <div>
            <p className="text-xs text-black/45">Clínica recebeu</p>
            <p className="mt-1 text-2xl font-bold">{brl(m.receivedClinic)}</p>
            <p className="text-xs text-black/40">
              Recebimentos com destino Clínica
            </p>
          </div>
          <div>
            <p className="text-xs text-black/45">
              Cota do professor — {split.professor_percentage}%
            </p>
            <p className="mt-1 text-2xl font-bold">{brl(m.shareProfessor)}</p>
            <p className="text-xs text-black/40">
              Valor que o professor deve ficar
            </p>
          </div>
          <div>
            <p className="text-xs text-black/45">
              Cota da clínica — {split.clinic_percentage}%
            </p>
            <p className="mt-1 text-2xl font-bold">{brl(m.shareClinic)}</p>
            <p className="text-xs text-black/40">
              Valor que a clínica deve ficar
            </p>
          </div>
          <div>
            <p className="text-xs text-black/45">Ajuste</p>
            <p className="mt-1 text-2xl font-bold">{brl(m.adjustment)}</p>
            <p className="text-xs text-black/40">
              Diferença necessária para equalizar
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <SectionTitle title="Status do fechamento" />
        <div className="flex items-start gap-4">
          <span className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/[.04] " + statusUi.text}>
            <statusUi.icon size={22} />
          </span>
          <div>
            <h2 className={"text-xl font-bold tracking-tight " + statusUi.text}>
              {statusUi.label}
            </h2>
            <p className="mt-1 text-sm text-black/55">{statusUi.detail}</p>
            <div className="mt-4 flex flex-wrap gap-6">
              <div>
                <p className="text-xs text-black/45">Saldo professor</p>
                <p className="text-lg font-bold text-black/80">
                  {brl(m.balanceProfessor)}
                </p>
              </div>
              <div>
                <p className="text-xs text-black/45">Saldo clínica</p>
                <p className="text-lg font-bold text-black/80">
                  {brl(m.balanceClinic)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <SectionTitle title="Composição por tipo de recebimento" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(m.byType).map(([type, value]) => (
            <div key={type}>
              <p className="text-xs text-black/45">{type}</p>
              <p className="mt-1 text-2xl font-bold">{brl(value)}</p>
            </div>
          ))}
          {!Object.keys(m.byType).length && (
            <p className="text-sm text-black/45">
              Nenhum pagamento recebido no período.
            </p>
          )}
        </div>
      </section>

      <section className="mb-10">
        <SectionTitle title="Detalhamento do fechamento" count={m.rows.length} />
        <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
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
                          ? "bg-sky-100 text-sky-700 ring-1 ring-sky-200"
                          : "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200")
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
                  <td className="p-4" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
