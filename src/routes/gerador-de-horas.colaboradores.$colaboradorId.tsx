import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { ArrowLeft, FileText, ExternalLink, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/gerador-de-horas/colaboradores/$colaboradorId")({ component: ColaboradorHoras });

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

type Report = { id:string; reference_month:string; period_start:string|null; period_end:string|null; generated_at:string; report_html:string; };

function ColaboradorHoras() {
  const { colaboradorId } = Route.useParams();
  const [collaborator, setCollaborator] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const year = new Date().getFullYear();

  async function load() {
    setLoading(true);
    const [c, r] = await Promise.all([
      (supabase as any).from("hour_generator_collaborators").select("*").eq("id", colaboradorId).maybeSingle(),
      (supabase as any).from("hour_generator_reports").select("*").eq("collaborator_id", colaboradorId).order("reference_month",{ascending:false}),
    ]);
    const err = c.error || r.error;
    if (err) setError(err.message);
    setCollaborator(c.data);
    setReports(r.data || []);
    setLoading(false);
  }
  useEffect(()=>{void load()},[colaboradorId]);

  function monthKey(monthIndex:number) {
    return `${year}-${String(monthIndex+1).padStart(2,"0")}-01`;
  }
  function reportFor(monthIndex:number) {
    const key=monthKey(monthIndex);
    return reports.find(r=>r.reference_month===key);
  }
  function openReport(report:Report) {
    const w=window.open("","_blank");
    if(!w)return;
    w.document.open(); w.document.write(report.report_html); w.document.close();
  }

  if (loading) return <AuthGuard><div className="min-h-screen bg-white"><TopBar/><AppShell><div className="py-12 text-center text-sm text-[#6B7280]">Carregando colaborador...</div></AppShell></div></AuthGuard>;
  if (!collaborator) return <AuthGuard><div className="min-h-screen bg-white"><TopBar/><AppShell><div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">Colaborador não encontrado.</div></AppShell></div></AuthGuard>;

  return <AuthGuard><div className="min-h-screen bg-white"><TopBar/><AppShell>
    <div className="mx-auto max-w-6xl">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/gerador-de-horas" className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#374151]"><ArrowLeft size={15}/> Colaboradores</Link>
          <h1 className="mt-3 text-[30px] font-bold tracking-tight text-[#1F2937]">{collaborator.name}</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Histórico de relatórios de {year}.</p>
        </div>
        <Link to="/gerador-de-horas/gerador" search={{ colaboradorId, month: `${year}-${String(new Date().getMonth()+1).padStart(2,"0")}` }} className="inline-flex items-center gap-2 rounded-xl bg-[#60A5FA] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3B82F6]"><Play size={16}/> Gerar relatório</Link>
      </div>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="rounded-2xl border border-black/10 bg-white p-5">
        <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="font-semibold text-[#1F2937]">Meses de referência</h2><p className="mt-1 text-xs text-[#6B7280]">Cada mês pode ter um único relatório salvo para este colaborador.</p></div><span className="rounded-full bg-[#F2F2F7] px-3 py-1 text-xs font-semibold text-[#4B5563]">{reports.length} salvo(s)</span></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MONTHS.map((label, i)=>{
            const report=reportFor(i);
            const month=monthKey(i).slice(0,7);
            return <div key={label} className="rounded-2xl border border-black/10 p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[#374151]">{label} {year}</p><p className="mt-1 text-xs text-[#9CA3AF]">{report ? `Gerado em ${new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(report.generated_at))}` : "Nenhum relatório anexado"}</p></div><FileText size={18} className={report ? "text-[#60A5FA]" : "text-[#D1D5DB]"} /></div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/gerador-de-horas/gerador" search={{colaboradorId,month}} className="inline-flex items-center gap-1.5 rounded-lg bg-[#F2F2F7] px-3 py-2 text-xs font-semibold text-[#4B5563]">{report ? "Editar relatório" : "Gerar relatório"}</Link>
                {report && <button type="button" onClick={()=>openReport(report)} className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-[#4B5563]"><ExternalLink size={14}/> Abrir</button>}
              </div>
            </div>
          })}
        </div>
      </section>
    </div>
  </AppShell></div></AuthGuard>;
}
