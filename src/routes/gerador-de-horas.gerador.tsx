import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { ArrowLeft, Download, FileText, Save, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { makeAttendanceReportHtml } from "@/lib/hour-generator";

export const Route = createFileRoute("/gerador-de-horas/gerador")({ component: Gerador });

type Collaborator = { id: string; name: string; active: boolean };
type Report = {
  id: string;
  collaborator_id: string;
  reference_month: string;
  period_start: string | null;
  period_end: string | null;
  repasse_percent: number;
  input_data: string;
  report_html: string;
  generated_at: string;
  updated_at: string;
};

function pad(n: number) { return String(n).padStart(2, "0"); }

function monthLabel(value: string) {
  const [y,m] = value.split("-").map(Number);
  if (!y || !m) return value;
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" })
    .format(new Date(y, m - 1, 1))
    .replace(/^./, c => c.toUpperCase());
}

function GeneratorPage() {
  const search = useRouterState({ select: s => s.location.search });
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const initialMonth = params.get("month") || `${new Date().getFullYear()}-${pad(new Date().getMonth()+1)}`;

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [collaboratorId, setCollaboratorId] = useState(params.get("colaboradorId") || "");
  const [month, setMonth] = useState(initialMonth);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [repasse, setRepasse] = useState("30");
  const [data, setData] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCollaborators() {
    const { data: list, error: listError } = await (supabase as any)
      .from("hour_generator_collaborators").select("id,name,active").eq("active", true).order("name");
    if (listError) { setError(listError.message); return; }
    const next = (list || []) as Collaborator[];
    setCollaborators(next);
    if (!collaboratorId && next[0]) setCollaboratorId(next[0].id);
  }

  async function loadReport() {
    if (!collaboratorId || !month) return;
    setLoadingReport(true);
    setMessage("");
    const { data: report, error: reportError } = await (supabase as any)
      .from("hour_generator_reports").select("*").eq("collaborator_id", collaboratorId)
      .eq("reference_month", `${month}-01`).maybeSingle();
    setLoadingReport(false);
    if (reportError) { setError(reportError.message); return; }
    if (report) {
      setPeriodStart(report.period_start ? new Date(report.period_start+"T12:00:00").toLocaleDateString("pt-BR") : "");
      setPeriodEnd(report.period_end ? new Date(report.period_end+"T12:00:00").toLocaleDateString("pt-BR") : "");
      setRepasse(String(report.repasse_percent ?? 0));
      setData(report.input_data || "");
      setHtml(report.report_html || "");
      setMessage("Relatório salvo carregado. Você pode editar e salvar novamente.");
    } else {
      setPeriodStart("");
      setPeriodEnd("");
      setRepasse("30");
      setData("");
      setHtml("");
    }
  }

  useEffect(()=>{ setLoading(true); void loadCollaborators().finally(()=>setLoading(false)); },[]);
  useEffect(()=>{ void loadReport(); },[collaboratorId,month]);

  const selected = collaborators.find(c=>c.id===collaboratorId);
  const competence = monthLabel(month);

  function buildHtml() {
    if (!selected) { setError("Selecione um colaborador."); return ""; }
    const pct = Math.max(0, Math.min(100, Number(repasse) || 0));
    const next = makeAttendanceReportHtml({
      collaboratorName: selected.name,
      competence,
      periodStart: periodStart.trim() || "—",
      periodEnd: periodEnd.trim() || "—",
      repassePercent: pct,
      data,
    });
    setHtml(next);
    setMessage("Relatório gerado.");
    setError("");
    return next;
  }

  function dateDb(value: string) {
    const match=value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return match ? `${match[3]}-${pad(Number(match[2]))}-${pad(Number(match[1]))}` : null;
  }

  async function save() {
    const nextHtml = html || buildHtml();
    if (!nextHtml || !selected) return;
    setSaving(true); setError(""); setMessage("");
    const { error: saveError } = await (supabase as any)
      .from("hour_generator_reports")
      .upsert({
        collaborator_id: collaboratorId,
        reference_month: `${month}-01`,
        period_start: dateDb(periodStart),
        period_end: dateDb(periodEnd),
        repasse_percent: Math.max(0, Math.min(100, Number(repasse) || 0)),
        input_data: data,
        report_html: nextHtml,
        updated_at: new Date().toISOString(),
      }, { onConflict: "collaborator_id,reference_month" });
    setSaving(false);
    if (saveError) { setError(saveError.message); return; }
    setMessage(`Relatório salvo em ${selected.name} — ${competence}.`);
  }

  function exportReport() {
    const nextHtml = html || buildHtml();
    if (!nextHtml) return;
    const w=window.open("","_blank");
    if(!w){ setError("Permita pop-ups para exportar o relatório."); return; }
    w.document.open(); w.document.write(nextHtml); w.document.close();
    setTimeout(()=>{ try { w.print(); } catch {} }, 250);
  }

  if (loading) return <AuthGuard><div className="min-h-screen bg-white"><TopBar/><AppShell><div className="py-12 text-center text-sm text-[#6B7280]">Carregando gerador...</div></AppShell></div></AuthGuard>;

  return <AuthGuard><div className="min-h-screen bg-white"><TopBar/><AppShell>
    <div className="mx-auto max-w-7xl">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <a href="/gerador-de-horas" className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#374151]"><ArrowLeft size={15}/> Colaboradores</a>
          <h1 className="mt-3 text-[30px] font-bold tracking-tight text-[#1F2937]">Gerador de relatório</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Um único gerador para todos os colaboradores e todas as competências.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={()=>void loadReport()} disabled={loadingReport} className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#4B5563]"><RefreshCw size={16}/> Recarregar</button>
          <button type="button" onClick={exportReport} disabled={!selected || !html} className="inline-flex items-center gap-2 rounded-xl bg-[#60A5FA] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#3B82F6]"><Download size={16}/> Exportar</button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <div className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-black/10 bg-white p-5">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2F2F7]"><FileText size={19} className="text-[#4B5563]"/></div><div><h2 className="font-semibold text-[#1F2937]">Dados do relatório</h2><p className="text-xs text-[#6B7280]">Preencha os dados exatamente como no gerador original.</p></div></div>

          <div className="mt-5 space-y-4">
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-[#6B7280]">Colaborador</span><select value={collaboratorId} onChange={e=>setCollaboratorId(e.target.value)} className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm text-[#374151]">{collaborators.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-[#6B7280]">Competência</span><input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm text-[#374151]"/></label>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-[#6B7280]">Início do período</span><input value={periodStart} onChange={e=>setPeriodStart(e.target.value)} placeholder="25/08/2026" className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm"/></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-[#6B7280]">Fim do período</span><input value={periodEnd} onChange={e=>setPeriodEnd(e.target.value)} placeholder="24/09/2026" className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm"/></label>
            </div>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-[#6B7280]">Repasse (%)</span><input type="number" min={0} max={100} step={0.5} value={repasse} onChange={e=>setRepasse(e.target.value)} className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm"/></label>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-[#6B7280]">Atendimentos</span><textarea value={data} onChange={e=>setData(e.target.value)} spellCheck={false} className="min-h-[220px] w-full rounded-xl border border-black/10 bg-[#FAFAFA] p-3 font-mono text-xs outline-none focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA]/10" placeholder="23/09 Leticia sem valor&#10;25/09 Felipe 135"/></label>
            <p className="text-xs leading-5 text-[#6B7280]">Uma linha por atendimento: data, paciente e valor. Use “sem valor” quando necessário e * depois da data para marcar observação.</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={buildHtml} disabled={!selected} className="inline-flex items-center gap-2 rounded-xl bg-[#60A5FA] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3B82F6] disabled:opacity-50"><FileText size={16}/> Gerar relatório</button>
            <button type="button" onClick={()=>void save()} disabled={saving || !selected} className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] disabled:opacity-50"><Save size={16}/> {saving ? "Salvando..." : "Salvar relatório"}</button>
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-black/10 bg-[#F6F1EF] p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8B5048]">Pré-visualização</p><h2 className="mt-1 text-lg font-semibold text-[#1F2937]">{selected?.name || "Colaborador"} — {competence}</h2></div>{html && <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#6B7280]">Relatório pronto</span>}</div>
          <div className="overflow-auto rounded-xl border border-[#E3C6BF] bg-white">
            {html ? <iframe title="Pré-visualização do relatório" srcDoc={html} className="h-[820px] w-full min-w-[620px] border-0" /> : <div className="flex min-h-[620px] items-center justify-center px-6 text-center text-sm text-[#777]"><div><FileText className="mx-auto mb-3 text-[#C98072]" size={30}/><p>Preencha os dados e clique em “Gerar relatório”.</p><p className="mt-1 text-xs text-[#999]">O relatório seguirá o modelo enviado.</p></div></div>}
          </div>
        </section>
      </div>
    </div>
  </AppShell></div></AuthGuard>;
}

function Gerador() { return <GeneratorPage/>; }
