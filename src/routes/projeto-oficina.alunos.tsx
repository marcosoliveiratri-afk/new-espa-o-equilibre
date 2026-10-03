import { createFileRoute, Link } from "@tanstack/react-router";
import { Link2, Plus, Search, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { TopBar } from "@/components/TopBar";
import { supabase } from "@/integrations/supabase/client";

export const Route=createFileRoute("/projeto-oficina/alunos")({component:Alunos});

const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
const fmt=(d:string|null)=>d?new Intl.DateTimeFormat("pt-BR").format(new Date(d+"T12:00:00")):"—";
const phone=(v:string|null)=>{const d=String(v||"").replace(/\D/g,"").slice(0,11);if(!d)return "";if(d.length<=2)return `(${d}`;if(d.length<=3)return `(${d.slice(0,2)}) ${d.slice(2)}`;if(d.length<=7)return `(${d.slice(0,2)}) ${d.slice(2,3)} ${d.slice(3)}`;return `(${d.slice(0,2)}) ${d.slice(2,3)} ${d.slice(3,7)}-${d.slice(7)}`;};
const statusFinancial=(p:any[])=>{const active=p.filter(x=>x.status!=="Cancelado").sort((a,b)=>String(a.due_date).localeCompare(String(b.due_date)));const today=new Date();const key=new Date(today.getFullYear(),today.getMonth(),1).toISOString().slice(0,10);const current=active.find(x=>String(x.due_date).slice(0,7)===key)||active.filter(x=>String(x.due_date)<=new Date().toISOString().slice(0,10)).at(-1)||active[0];if(!current)return "Sem cobrança";if(current.status==="Pago")return "Em dia";const diff=Math.ceil((new Date(current.due_date+"T12:00:00").getTime()-new Date(new Date().toISOString().slice(0,10)+"T12:00:00").getTime())/86400000);return diff<0?"Em atraso":diff<=7?"Próximo":"Em dia";};

function Alunos(){
 const [rows,setRows]=useState<any[]>([]),[plans,setPlans]=useState<any[]>([]),[teachers,setTeachers]=useState<any[]>([]);
 const [search,setSearch]=useState(""),[activity,setActivity]=useState("Ativos"),[planFilter,setPlanFilter]=useState("Todos"),[teacherFilter,setTeacherFilter]=useState("Todos"),[destinationFilter,setDestinationFilter]=useState("Todos"),[financialFilter,setFinancialFilter]=useState("Todos");
 const [show,setShow]=useState(false),[showLink,setShowLink]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const [form,setForm]=useState({full_name:"",responsible_name:"",age:"",birth_date:"",phone:"",whatsapp:"",email:"",cpf:"",address:"",notes:""});
 const [link,setLink]=useState({aluno_id:"",plano_id:"",professor_id:"",start_date:new Date().toISOString().slice(0,10),due_day:"10",agreed_value:"",payment_method:"PIX - CNPJ",destination:"Oficina"});

 async function load(){
  const [{data:a,error:ae},{data:p,error:pe},{data:t,error:te}]=await Promise.all([
   supabase.from("oficina_alunos").select("*").order("full_name"),
   supabase.from("oficina_planos").select("*").eq("active",true).order("duration_months"),
   supabase.from("oficina_professores").select("*").eq("active",true).order("name")
  ]);
  if(ae||pe||te){setError(ae?.message||pe?.message||te?.message||"Não foi possível carregar os dados.");return}
  const alunos=a||[];
  const {data:aps,error:ape}=await supabase.from("oficina_aluno_planos").select("*,oficina_planos(name,duration_months),oficina_professores(name)");
  if(ape){setError(ape.message);return}
  const {data:payments,error:payError}=await supabase.from("oficina_pagamentos").select("id,aluno_plano_id,amount,status,due_date,paid_at,payment_method,destination").order("due_date");
  if(payError){setError(payError.message);return}
  const paymentByPlan=new Map<string,any[]>();(payments||[]).forEach(x=>{const list=paymentByPlan.get(x.aluno_plano_id)||[];list.push(x);paymentByPlan.set(x.aluno_plano_id,list)});
  const planByAluno=new Map<string,any>();(aps||[]).filter(x=>x.status==="Ativo").forEach(x=>{if(!planByAluno.has(x.aluno_id))planByAluno.set(x.aluno_id,x)});
  setRows(alunos.map(x=>{const ap=planByAluno.get(x.id);const ps=ap?paymentByPlan.get(ap.id)||[]:[];return {...x,planName:ap?.oficina_planos?.name||"—",teacherName:ap?.oficina_professores?.name||"—",dueDay:ap?.due_day,agreedValue:ap?.agreed_value||0,destination:ap?.destination||"—",financial:statusFinancial(ps)};}));
  setPlans(p||[]);setTeachers(t||[]);
 }
 useEffect(()=>{void load()},[]);

 const filtered=useMemo(()=>rows.filter(x=>
  (!search||x.full_name.toLowerCase().includes(search.toLowerCase())||String(x.phone||"").includes(search)||String(x.responsible_name||"").toLowerCase().includes(search.toLowerCase())) &&
  (activity==="Todos"||(activity==="Ativos"?x.active:!x.active)) &&
  (planFilter==="Todos"||x.planName===planFilter) &&
  (teacherFilter==="Todos"||x.teacherName===teacherFilter) &&
  (destinationFilter==="Todos"||x.destination===destinationFilter) &&
  (financialFilter==="Todos"||x.financial===financialFilter)
 ),[rows,search,activity,planFilter,teacherFilter,destinationFilter,financialFilter]);

 async function save(e:React.FormEvent){
  e.preventDefault();setError("");
  const name=form.full_name.trim(),responsible=form.responsible_name.trim(),age=Number(form.age);
  if(!name){setError("Informe o nome da criança.");return}
  if(!responsible){setError("Informe o nome do responsável.");return}
  if(!Number.isInteger(age)||age<0||age>18){setError("Informe uma idade válida.");return}
  setSaving(true);
  const {error}=await supabase.from("oficina_alunos").insert({full_name:name,responsible_name:responsible,age,birth_date:form.birth_date||null,phone:form.phone.replace(/\D/g,"")||null,whatsapp:form.whatsapp.replace(/\D/g,"")||null,email:form.email.trim()||null,cpf:form.cpf.trim()||null,address:form.address.trim()||null,notes:form.notes.trim()||null});
  setSaving(false);
  if(error){setError(error.message);return}
  setForm({full_name:"",responsible_name:"",age:"",birth_date:"",phone:"",whatsapp:"",email:"",cpf:"",address:"",notes:""});setShow(false);await load();
 }

 async function linkPlan(e:React.FormEvent){
  e.preventDefault();setError("");
  if(!link.aluno_id||!link.plano_id||!link.start_date||!link.due_day){setError("Preencha aluno, plano, início e vencimento.");return}
  const selectedPlan=plans.find(x=>x.id===link.plano_id);const value=Number(String(link.agreed_value).replace(",","."));
  if(!selectedPlan||!Number.isFinite(value)||value<0){setError("Informe um valor válido.");return}
  setSaving(true);
  const {data:ap,error}=await supabase.from("oficina_aluno_planos").insert({aluno_id:link.aluno_id,plano_id:link.plano_id,professor_id:link.professor_id||null,start_date:link.start_date,due_day:Number(link.due_day),agreed_value:value,payment_method:link.payment_method||null,destination:link.destination||"Oficina",status:"Ativo"}).select("id").single();
  if(error){setSaving(false);setError(error.message);return}
  const start=new Date(link.start_date+"T12:00:00");const last=new Date(start.getFullYear(),start.getMonth()+1,0);const day=Math.min(Number(link.due_day),last.getDate());const due=`${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  const {error:paymentError}=await supabase.from("oficina_pagamentos").insert({aluno_plano_id:ap.id,due_date:due,amount:value,status:"Em aberto",payment_method:link.payment_method||null,destination:link.destination||"Oficina"});
  setSaving(false);if(paymentError){setError(paymentError.message);return}
  setLink({...link,aluno_id:"",plano_id:"",professor_id:"",agreed_value:""});setShowLink(false);await load();
 }

 return <AuthGuard><div className="min-h-screen bg-white"><TopBar/><main className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl">
  <header className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-black/40">Projeto Oficina</p><h1 className="mt-1 text-[30px] font-bold leading-[1.2] text-[#111827]">Cadastro de Alunos</h1><p className="mt-1 text-sm text-black/50">{filtered.length} de {rows.length} alunos cadastrados</p></div><div className="flex gap-2"><Link to="/projeto-oficina/alertas" className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium">Central de alertas</Link><button onClick={()=>setShowLink(true)} className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium"><Link2 size={16}/>Vincular plano</button><button onClick={()=>setShow(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-medium text-white"><Plus size={16}/>Novo aluno</button></div></header>
  {error&&<div className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
  <section className="mb-5 rounded-2xl border border-black/10 bg-white p-4"><div className="flex flex-wrap gap-2 mb-3">{["Todos",...plans.map(x=>x.name)].map(v=><button key={v} onClick={()=>setPlanFilter(v)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${planFilter===v?"bg-[#111827] text-white":"border border-black/10 text-black/55"}`}>{v}</button>)}</div><div className="flex flex-wrap gap-2"><div className="relative min-w-[240px] flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por aluno, responsável ou telefone..." className="h-10 w-full rounded-lg border border-black/10 pl-10 pr-3 text-sm outline-none"/></div><select value={activity} onChange={e=>setActivity(e.target.value)} className="h-10 rounded-lg border border-black/10 px-3 text-sm"><option>Ativos</option><option>Inativos</option><option>Todos</option></select><select value={teacherFilter} onChange={e=>setTeacherFilter(e.target.value)} className="h-10 rounded-lg border border-black/10 px-3 text-sm"><option value="Todos">Todos os professores</option>{teachers.map(x=><option key={x.id}>{x.name}</option>)}</select><select value={financialFilter} onChange={e=>setFinancialFilter(e.target.value)} className="h-10 rounded-lg border border-black/10 px-3 text-sm"><option>Todos</option><option>Em dia</option><option>Próximo</option><option>Em atraso</option><option>Sem cobrança</option></select></div></section>
  <section className="overflow-hidden rounded-2xl border border-black/10"><div className="overflow-x-auto"><table className="w-full min-w-[1280px] text-left text-sm"><thead className="bg-[#f8fafc] text-xs uppercase tracking-wide text-black/45"><tr>{["Aluno","Responsável","Idade","Plano","Professor","Vencimento","Valor","Situação","Financeiro","Destino",""].map(h=><th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{filtered.map(x=>{const initials=x.full_name.split(" ").filter(Boolean).slice(0,2).map((n:string)=>n[0]).join("").toUpperCase();const fin=x.financial;return <tr key={x.id} className="border-t border-black/10 hover:bg-black/[.02]"><td className="px-4 py-4"><Link to="/projeto-oficina/alunos/$alunoId" params={{alunoId:x.id}} className="flex items-center gap-3 text-[#111827]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 text-xs font-bold">{initials}</span><span><strong className="block">{x.full_name}</strong><span className="text-[11px] text-black/40">{x.active?"Aluno ativo":"Aluno inativo"}</span></span></Link></td><td className="px-4 py-4 text-black/55">{x.responsible_name||"—"}</td><td className="px-4 py-4 text-black/55">{x.age!=null?`${x.age} anos`:"—"}</td><td className="px-4 py-4">{x.planName}</td><td className="px-4 py-4 text-black/55">{x.teacherName}</td><td className="px-4 py-4 text-black/55">{x.dueDay?`Dia ${x.dueDay}`:"—"}</td><td className="px-4 py-4 font-medium">{x.agreedValue?money(Number(x.agreedValue)):"—"}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${x.active?"bg-emerald-50 text-emerald-700":"bg-gray-100 text-gray-500"}`}>{x.active?"Ativo":"Inativo"}</span></td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${fin==="Em atraso"?"bg-red-50 text-red-700":fin==="Próximo"?"bg-amber-50 text-amber-700":fin==="Em dia"?"bg-emerald-50 text-emerald-700":"bg-gray-100 text-gray-500"}`}>{fin}</span></td><td className="px-4 py-4 text-black/55">{x.destination}</td><td className="px-4 py-4 text-right"><Link to="/projeto-oficina/alunos/$alunoId" params={{alunoId:x.id}} className="text-xs font-medium underline underline-offset-2">Abrir</Link></td></tr>})}{!filtered.length&&<tr><td colSpan={11} className="p-12 text-center text-sm text-black/45">Nenhum aluno encontrado.</td></tr>}</tbody></table></div></section>
 </div></main></div>
 {show&&<Modal title="Novo aluno" close={()=>setShow(false)}><form onSubmit={save} className="grid gap-4 sm:grid-cols-2">{Field("Nome da criança",<input required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/>)}{Field("Nome do responsável",<input required value={form.responsible_name} onChange={e=>setForm({...form,responsible_name:e.target.value})}/>)}{Field("Idade",<input required type="number" min="0" max="18" value={form.age} onChange={e=>setForm({...form,age:e.target.value})}/>)}{Field("Data de nascimento",<input type="date" value={form.birth_date} onChange={e=>setForm({...form,birth_date:e.target.value})}/>)}{Field("Telefone",<input value={phone(form.phone)} onChange={e=>setForm({...form,phone:e.target.value})}/>)}{Field("WhatsApp",<input value={phone(form.whatsapp)} onChange={e=>setForm({...form,whatsapp:e.target.value})}/>)}{Field("E-mail",<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>)}{Field("CPF",<input value={form.cpf} onChange={e=>setForm({...form,cpf:e.target.value})}/>)}{Field("Endereço",<input value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>)}{Field("Observações",<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>)}<button disabled={saving} className="sm:col-span-2 rounded-xl bg-[#111827] px-4 py-3 text-sm font-medium text-white disabled:opacity-40">Salvar aluno</button></form></Modal>}
 {showLink&&<Modal title="Vincular plano ao aluno" close={()=>setShowLink(false)}><form onSubmit={linkPlan} className="grid gap-4">{Field("Aluno",<select required value={link.aluno_id} onChange={e=>setLink({...link,aluno_id:e.target.value})}><option value="">Selecione</option>{rows.map(x=><option key={x.id} value={x.id}>{x.full_name}</option>)}</select>)}{Field("Plano",<select required value={link.plano_id} onChange={e=>{const p=plans.find(x=>x.id===e.target.value);setLink({...link,plano_id:e.target.value,agreed_value:p?String(p.monthly_value):""})}}><option value="">Selecione</option>{plans.map(x=><option key={x.id} value={x.id}>{x.name} · {money(Number(x.monthly_value))}</option>)}</select>)}{Field("Professor",<select value={link.professor_id} onChange={e=>setLink({...link,professor_id:e.target.value})}><option value="">Sem professor</option>{teachers.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>)}{Field("Valor acordado",<input required type="number" min="0" step=".01" value={link.agreed_value} onChange={e=>setLink({...link,agreed_value:e.target.value})}/>)}{Field("Data de início",<input required type="date" value={link.start_date} onChange={e=>setLink({...link,start_date:e.target.value})}/>)}{Field("Dia de vencimento",<input required type="number" min="1" max="31" value={link.due_day} onChange={e=>setLink({...link,due_day:e.target.value})}/>)}{Field("Forma de pagamento",<select value={link.payment_method} onChange={e=>setLink({...link,payment_method:e.target.value})}><option>PIX - CNPJ</option><option>PIX - Professor</option><option>Dinheiro</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Transferência</option><option>Boleto</option></select>)}{Field("Destino",<select value={link.destination} onChange={e=>setLink({...link,destination:e.target.value})}><option>Oficina</option><option>Professor</option></select>)}<button disabled={saving} className="rounded-xl bg-[#111827] py-3 text-sm font-medium text-white disabled:opacity-40">Vincular e gerar primeira cobrança</button></form></Modal>}
 </AuthGuard>
}
function Field(label:string,content:React.ReactNode){return <label className="block text-sm"><span className="mb-1.5 block text-xs font-medium text-black/55">{label}</span><div className="[&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-black/10 [&_input]:px-3 [&_input]:py-2.5 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-black/10 [&_textarea]:px-3 [&_textarea]:py-2.5 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-black/10 [&_select]:px-3 [&_select]:py-2.5">{content}</div></label>}
function Modal(p:{title:string;close:()=>void;children:React.ReactNode}){return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={e=>{if(e.target===e.currentTarget)p.close()}}><div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">{p.title}</h2><button onClick={p.close}><X size={18}/></button></div>{p.children}</div></div>}
