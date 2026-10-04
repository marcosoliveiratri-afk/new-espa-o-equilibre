import { createFileRoute } from "@tanstack/react-router";
import { Plus, UsersRound, UserRoundCog, Clock3, CalendarDays, Power, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { TopBar } from "@/components/TopBar";
import { OficinaSidebar } from "@/components/OficinaSidebar";
import { supabase } from "@/integrations/supabase/client";

type Turma = { id:string; name:string; professor_id:string|null; teacher_name:string; weekday:number; start_time:string; duration_minutes:number; hourly_rate:number; active:boolean };
type Pessoa = { id:string; full_name?:string; name?:string };

const days = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];

export const Route = createFileRoute("/projeto-oficina/turmas")({ component: TurmasPage });

function TurmasPage() {
  const [turmas,setTurmas] = useState<Turma[]>([]);
  const [professores,setProfessores] = useState<Pessoa[]>([]);
  const [alunos,setAlunos] = useState<Pessoa[]>([]);
  const [selected,setSelected] = useState<Turma|null>(null);
  const [selectedStudents,setSelectedStudents] = useState<string[]>([]);
  const [showForm,setShowForm] = useState(false);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  const [form,setForm] = useState({name:"",professor_id:"",weekday:"1",start_time:"14:00",duration_minutes:"60",hourly_rate:"0"});

  async function load() {
    const [{data:t,error:te},{data:p},{data:a}] = await Promise.all([
      supabase.from("oficina_turmas").select("*").order("weekday").order("start_time"),
      supabase.from("oficina_professores").select("id,name").eq("active",true).order("name"),
      supabase.from("oficina_alunos").select("id,full_name").eq("active",true).order("full_name"),
    ]);
    if (te) setError(te.message);
    setTurmas((t ?? []) as Turma[]);
    setProfessores((p ?? []) as Pessoa[]);
    setAlunos((a ?? []) as Pessoa[]);
    const namesById = new Map((a ?? []).map(x=>[x.id,x.full_name]));
    const grouped: Record<string,string[]> = {};
    (links ?? []).forEach(x=>{
      const name = namesById.get(x.aluno_id);
      if (name) (grouped[x.turma_id] ??= []).push(name);
    });
    setAlunosPorTurma(grouped);
  }

  useEffect(()=>{ void load(); },[]);

  async function saveTurma(e:React.FormEvent) {
    e.preventDefault(); setError("");
    if (!form.name.trim() || !form.professor_id) { setError("Informe o nome da turma e o professor."); return; }
    setSaving(true);
    const professor = professores.find(p=>p.id===form.professor_id);
    const {error:insertError} = await supabase.from("oficina_turmas").insert({
      name: form.name.trim(),
      professor_id: form.professor_id,
      teacher_name: professor?.name ?? "",
      weekday: Number(form.weekday),
      start_time: form.start_time,
      duration_minutes: Number(form.duration_minutes),
      hourly_rate: Number(form.hourly_rate),
      active: true,
    });
    setSaving(false);
    if (insertError) { setError(insertError.message); return; }
    setShowForm(false);
    setForm({name:"",professor_id:"",weekday:"1",start_time:"14:00",duration_minutes:"60",hourly_rate:"0"});
    await load();
  }

  async function toggleTurma(t:Turma) {
    const {error:upError} = await supabase.from("oficina_turmas").update({active:!t.active}).eq("id",t.id);
    if (upError) { setError(upError.message); return; }
    await load();
  }

  async function removeTurma(t:Turma) {
    if (!window.confirm(`Excluir a turma "${t.name}"? As ocorrências vinculadas podem impedir a exclusão. Nesse caso, desative a turma.`)) return;
    const {error:deleteError} = await supabase.from("oficina_turmas").delete().eq("id",t.id);
    if (deleteError) { setError("Não foi possível excluir esta turma. Se ela já possui aulas ou alunos vinculados, desative-a para preservar o histórico."); return; }
    if (selected?.id===t.id) setSelected(null);
    await load();
  }

  async function openStudents(t:Turma) {
    setError("");
    const {data,error:readError} = await supabase.from("oficina_turma_alunos").select("aluno_id").eq("turma_id",t.id).eq("active",true);
    if (readError) { setError(readError.message); return; }
    setSelected(t);
    setSelectedStudents((data ?? []).map(x=>x.aluno_id));
  }

  function toggleStudent(id:string) {
    setSelectedStudents(current => current.includes(id) ? current.filter(x=>x!==id) : [...current,id]);
  }

  async function saveStudents() {
    if (!selected) return;
    setSaving(true); setError("");
    const {error:deleteError} = await supabase.from("oficina_turma_alunos").delete().eq("turma_id",selected.id);
    if (deleteError) { setSaving(false); setError(deleteError.message); return; }
    if (selectedStudents.length) {
      const {error:insertError} = await supabase.from("oficina_turma_alunos").insert(selectedStudents.map(aluno_id=>({turma_id:selected.id,aluno_id,active:true})));
      if (insertError) { setSaving(false); setError(insertError.message); return; }
    }
    setSaving(false);
    setSelected(null);
  }

  return <AuthGuard><div className="min-h-screen bg-white"><TopBar/><div className="flex min-h-[calc(100vh-64px)]"><OficinaSidebar/><main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl">
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[.12em] text-black/40">Projeto Oficina</p><h1 className="mt-1 text-[30px] font-bold tracking-[-0.02em] text-[#111827]">Turmas</h1><p className="mt-2 text-sm text-black/55">Crie e visualize as turmas, defina o professor e vincule os alunos de cada turma.</p></div>
      <button onClick={()=>setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-medium text-white"><Plus size={17}/> Nova turma</button>
    </header>

    {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {turmas.map(t=><article key={t.id} className={`rounded-2xl border p-5 ${t.active?"border-black/10":"border-black/10 bg-black/[.025] opacity-70"}`}>
        <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-[#111827]">{t.name}</h2><p className="mt-1 text-sm text-black/50">{days[t.weekday-1]} · {t.start_time.slice(0,5)}</p></div><span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-medium">{t.active?"Ativa":"Desativada"}</span></div>
        <div className="mt-4 space-y-2 text-sm text-black/60"><p className="flex items-center gap-2"><UserRoundCog size={15}/> {t.teacher_name || "Sem professor"}</p><p className="flex items-center gap-2"><Clock3 size={15}/> {t.duration_minutes} min · {money(Number(t.hourly_rate))}/h</p><p className="flex items-center gap-2"><CalendarDays size={15}/> {days[t.weekday-1]}</p></div>
        <div className="mt-5 border-t border-black/10 pt-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-black/45"><UsersRound size={14}/> Alunos ({alunosPorTurma[t.id]?.length ?? 0})</div>
          {alunosPorTurma[t.id]?.length ? <div className="space-y-1.5">{alunosPorTurma[t.id].map(name=><div key={name} className="rounded-lg bg-black/[.035] px-3 py-2 text-sm text-black/70">{name}</div>)}</div> : <p className="text-sm text-black/40">Nenhum aluno vinculado.</p>}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={()=>openStudents(t)} className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium"><UsersRound size={14}/> Alunos da turma</button>
          <button onClick={()=>toggleTurma(t)} className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium"><Power size={14}/>{t.active?"Desativar":"Ativar"}</button>
          <button onClick={()=>removeTurma(t)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700"><Trash2 size={14}/> Excluir</button>
        </div>
      </article>)}
      {!turmas.length && <div className="rounded-2xl border border-dashed border-black/15 p-10 text-center md:col-span-2 xl:col-span-3"><UsersRound className="mx-auto text-black/25"/><p className="mt-3 font-medium">Nenhuma turma cadastrada</p><p className="mt-1 text-sm text-black/50">Clique em “Nova turma” para começar.</p></div>}
    </div>

    {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><form onSubmit={saveTurma} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">Nova turma</h2><button type="button" onClick={()=>setShowForm(false)}><X size={18}/></button></div><div className="grid gap-4 sm:grid-cols-2">
      {Field("Nome da turma",<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>)}{Field("Professor",<select required value={form.professor_id} onChange={e=>setForm({...form,professor_id:e.target.value})}><option value="">Selecione</option>{professores.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>)}{Field("Dia",<select value={form.weekday} onChange={e=>setForm({...form,weekday:e.target.value})}>{days.map((d,i)=><option key={d} value={i+1}>{d}</option>)}</select>)}{Field("Horário",<input type="time" required value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})}/>)}{Field("Duração (min)",<input type="number" min="15" step="15" required value={form.duration_minutes} onChange={e=>setForm({...form,duration_minutes:e.target.value})}/>)}{Field("Valor por hora",<input type="number" min="0" step=".01" required value={form.hourly_rate} onChange={e=>setForm({...form,hourly_rate:e.target.value})}/>)}</div><button disabled={saving} className="mt-6 w-full rounded-xl bg-[#111827] px-4 py-3 text-sm font-medium text-white disabled:opacity-50">{saving?"Salvando...":"Salvar turma"}</button></form></div>}

    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><section className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl"><header className="flex items-center justify-between border-b border-black/10 p-5"><div><h2 className="text-lg font-semibold">Alunos — {selected.name}</h2><p className="mt-1 text-sm text-black/50">{selectedStudents.length} aluno(s) selecionado(s)</p></div><button onClick={()=>setSelected(null)}><X size={18}/></button></header><div className="grid flex-1 gap-2 overflow-y-auto p-5 sm:grid-cols-2">{alunos.map(a=>{const checked=selectedStudents.includes(a.id);return <label key={a.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${checked?"border-black bg-black/[.03]":"border-black/10"}`}><input type="checkbox" checked={checked} onChange={()=>toggleStudent(a.id)}/><span className="text-sm font-medium">{a.full_name}</span></label>})}{!alunos.length&&<p className="text-sm text-black/50 sm:col-span-2">Cadastre os alunos primeiro.</p>}</div><footer className="flex justify-end gap-2 border-t border-black/10 p-5"><button onClick={()=>setSelected(null)} className="rounded-xl border border-black/10 px-4 py-2.5 text-sm">Cancelar</button><button onClick={saveStudents} disabled={saving} className="rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{saving?"Salvando...":"Salvar alunos"}</button></footer></section></div>}
  </div></main></div></div></AuthGuard>
}

function Field(label:string,child:React.ReactNode){return <label className="block"><span className="mb-1.5 block text-xs font-medium text-black/60">{label}</span><div className="[&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-black/10 [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-sm [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-black/10 [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-sm">{child}</div></label>}
function money(v:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v)}
