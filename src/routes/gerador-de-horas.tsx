import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { UserPlus, Users, FileText, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/gerador-de-horas")({ component: GeradorDeHoras });

type Collaborator = {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
};

function GeradorDeHoras() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const [c, r] = await Promise.all([
      (supabase as any).from("hour_generator_collaborators").select("*").eq("active", true).order("name"),
      (supabase as any).from("hour_generator_reports").select("collaborator_id"),
    ]);
    const err = [c, r].find((x: any) => x.error)?.error;
    if (err) setError(err.message);
    const list = (c.data || []) as Collaborator[];
    const counts: Record<string, number> = {};
    for (const item of (r.data || []) as any[]) counts[item.collaborator_id] = (counts[item.collaborator_id] || 0) + 1;
    setCollaborators(list);
    setReportCounts(counts);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  if (pathname !== "/gerador-de-horas") {
    return <Outlet />;
  }

  async function createCollaborator() {
    const normalized = name.trim();
    if (!normalized) {
      setError("Informe o nome do colaborador.");
      return;
    }
    setSaving(true);
    setError("");
    const { error: insertError } = await (supabase as any)
      .from("hour_generator_collaborators")
      .insert({ name: normalized });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setName("");
    setShowForm(false);
    await load();
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white">
        <TopBar />
        <AppShell>
          <div className="mx-auto max-w-6xl">
            <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/40">Gerador de Horas</p>
                <h1 className="mt-1 text-[30px] font-bold tracking-tight text-[#1F2937]">Colaboradores</h1>
                <p className="mt-2 text-sm text-[#6B7280]">Cada colaborador possui seu próprio histórico de relatórios por mês.</p>
              </div>
              <button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#60A5FA] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3B82F6]">
                <UserPlus size={17} /> Novo colaborador
              </button>
            </header>

            {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2F2F7]"><Users size={19} className="text-[#4B5563]" /></div>
                <p className="mt-4 text-sm text-[#6B7280]">Colaboradores ativos</p>
                <p className="mt-1 text-2xl font-bold text-[#1F2937]">{collaborators.length}</p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-5 sm:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-sm font-semibold text-[#374151]">Gerador único</p><p className="mt-1 text-sm text-[#6B7280]">Use o mesmo gerador para qualquer colaborador e mês de referência.</p></div>
                  <Link to="/gerador-de-horas/gerador" className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-[#374151] hover:bg-gray-50">Abrir gerador <ArrowRight size={16}/></Link>
                </div>
              </div>
            </div>

            <section className="overflow-hidden rounded-2xl border border-black/10 bg-white">
              <div className="border-b border-black/5 px-5 py-4">
                <h2 className="font-semibold text-[#1F2937]">Lista de colaboradores</h2>
                <p className="mt-1 text-xs text-[#6B7280]">Entre em um nome para visualizar os 12 meses e os relatórios já anexados.</p>
              </div>

              {loading ? <div className="px-5 py-12 text-center text-sm text-[#9CA3AF]">Carregando colaboradores...</div> :
              collaborators.length === 0 ? <div className="px-5 py-12 text-center text-sm text-[#6B7280]">Nenhum colaborador cadastrado.</div> :
              <div className="divide-y divide-black/5">
                {collaborators.map((c) => (
                  <Link key={c.id} to="/gerador-de-horas/colaboradores/$colaboradorId" params={{ colaboradorId: c.id }} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2F2F7] text-sm font-bold text-[#4B5563]">{c.name.split(" ").filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()}</div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#1F2937]">{c.name}</p>
                        <p className="mt-0.5 text-xs text-[#6B7280]">{reportCounts[c.id] || 0} relatório(s) salvo(s)</p>
                      </div>
                    </div>
                    <ArrowRight size={18} className="shrink-0 text-[#9CA3AF]" />
                  </Link>
                ))}
              </div>}
            </section>
          </div>

          {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={(e)=>{if(e.target===e.currentTarget)setShowForm(false)}}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-[#1F2937]">Novo colaborador</h2>
              <p className="mt-1 text-sm text-[#6B7280]">Cadastre o nome que será usado nos relatórios.</p>
              <label className="mt-5 block"><span className="mb-1.5 block text-sm font-medium text-[#374151]">Nome</span><input autoFocus value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void createCollaborator()}} className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA]/10" placeholder="Ex.: Patricia" /></label>
              <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={()=>setShowForm(false)} className="rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[#4B5563]">Cancelar</button><button type="button" onClick={()=>void createCollaborator()} disabled={saving} className="rounded-xl bg-[#60A5FA] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Salvando..." : "Criar colaborador"}</button></div>
            </div>
          </div>}
        </AppShell>
      </div>
    </AuthGuard>
  );
}
