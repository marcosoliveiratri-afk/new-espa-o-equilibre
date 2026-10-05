import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Check, CircleDollarSign, Clock3, FileText, Plus, Users, WalletCards, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { TopBar } from "@/components/TopBar";
import { OficinaSidebar } from "@/components/OficinaSidebar";
import { supabase } from "@/integrations/supabase/client";

export const Route=createFileRoute("/projeto-oficina/financeiro")({
 component:Financeiro,
 head:()=>({meta:[
  {title:"Financeiro — Projeto Oficina"},
  {name:"description",content:"Controle de pagamentos dos alunos, horas dos professores e fechamento financeiro mensal."},
 ]}),
});

type Payment={
 id:string;
 aluno_plano_id:string;
 due_date:string;
 paid_at:string|null;
 amount:number;
 payment_method:string|null;
 destination:string|null;
 status:string;
 oficina_aluno_planos?:{
  oficina_alunos?:{full_name:string;responsible_name:string|null}|null;
  oficina_planos?:{name:string}|null;
  oficina_professores?:{name:string}|null;
 }|null;
};

type Aula={id:string;turma_id:string;aula_date:string;start_time:string;duration_minutes:number;teacher_name:string;hourly_rate:number;status:string;turma_name?:string|null;};
type Turma={id:string;name:string;teacher_name:string;weekday:number;start_time:string;duration_minutes:number;hourly_rate:number;active:boolean;professor_id:string|null;};
type ProfessorSchedule={name:string;professor_id:string|null;weeklyHours:number;monthlyHours:number;monthlyAmount:number;weeklyByDay:number[];classes:number;workDays:number;turmas:Turma[];};

const money=(v:number)=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const dateBR=(d:string|null)=>d?new Intl.DateTimeFormat("pt-BR").format(new Date(d+"T12:00:00")):"—";
const localDate=(d:Date)=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const monthLabel=(d:Date)=>d.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
const days=["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];

function Financeiro(){
 const [month,setMonth]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1));
 const [payments,setPayments]=useState<Payment[]>([]);
 const [aulas,setAulas]=useState<Aula[]>([]);
 const [turmas,setTurmas]=useState<Turma[]>([]);
 const [expenses,setExpenses]=useState<any[]>([]);
 const [loading,setLoading]=useState(true);
 const [generating,setGenerating]=useState(false);
 const [error,setError]=useState("");
 const [showExpense,setShowExpense]=useState(false);
 const [tab,setTab]=useState<"pagamentos"|"professores">("pagamentos");
 const [search,setSearch]=useState("");
 const [statusFilter,setStatusFilter]=useState("Todos");
 const [expense,setExpense]=useState({description:"",amount:"",category:"Operacional",payment_method:"Pix",expense_date:localDate(new Date())});

 const start=localDate(new Date(month.getFullYear(),month.getMonth(),1));
 const end=localDate(new Date(month.getFullYear(),month.getMonth()+1,0));

 async function ensureMonthlyCharges(){
  const now=new Date();
  if(month.getFullYear()!==now.getFullYear()||month.getMonth()!==now.getMonth()||generating)return;
  setGenerating(true);
  try{
   const target=new Date(month.getFullYear(),month.getMonth(),1);
   const monthKey=localDate(target).slice(0,7);
   const result=await supabase.from("oficina_aluno_planos").select("id,start_date,end_date,due_day,agreed_value,status,payment_method,destination,oficina_planos(duration_months)").eq("status","Ativo");
   if(result.error)throw result.error;
   const existing=await supabase.from("oficina_pagamentos").select("aluno_plano_id,due_date").gte("due_date",start).lte("due_date",end);
   if(existing.error)throw existing.error;
   const existingKeys=new Set((existing.data||[]).map(x=>String(x.aluno_plano_id)+"|"+String(x.due_date).slice(0,7)));
   const rows:any[]=[];
   for(const p of result.data||[]){
    const startDate=new Date(p.start_date+"T12:00:00");
    const endDate=p.end_date?new Date(p.end_date+"T12:00:00"):null;
    if(startDate>new Date(month.getFullYear(),month.getMonth()+1,0)||(endDate&&endDate<target))continue;
    const diff=(target.getFullYear()-startDate.getFullYear())*12+target.getMonth()-startDate.getMonth();
    const duration=Math.max(1,Number(p.oficina_planos?.duration_months||1));
    if(diff<0||diff%duration!==0)continue;
    if(existingKeys.has(String(p.id)+"|"+monthKey))continue;
    const day=Math.min(Number(p.due_day||10),new Date(target.getFullYear(),target.getMonth()+1,0).getDate());
    rows.push({
     aluno_plano_id:p.id,
     due_date:localDate(new Date(target.getFullYear(),target.getMonth(),day)),
     amount:Number(p.agreed_value||0),
     payment_method:p.payment_method||null,
     destination:p.destination||"Oficina",
     status:"Em aberto"
    });
   }
   if(rows.length){
    const inserted=await supabase.from("oficina_pagamentos").insert(rows);
    if(inserted.error)throw inserted.error;
   }
  }catch(e:any){
   setError(e?.message||"Não foi possível gerar as cobranças do mês.");
  }finally{setGenerating(false)}
 }

 async function load(){
  setLoading(true);
  setError("");
  await ensureMonthlyCharges();
  const [{data:pDue,error:dueError},{data:pPaid,error:paidError},{data:a,error:aulaError},{data:t,error:turmaError},{data:e,error:expenseError}]=await Promise.all([
   supabase.from("oficina_pagamentos").select("*,oficina_aluno_planos(oficina_alunos(full_name,responsible_name),oficina_planos(name),oficina_professores(name))").gte("due_date",start).lte("due_date",end).order("due_date"),
   supabase.from("oficina_pagamentos").select("*,oficina_aluno_planos(oficina_alunos(full_name,responsible_name),oficina_planos(name),oficina_professores(name))").eq("status","Pago").gte("due_date",start).lte("due_date",end).order("due_date"),
   supabase.from("oficina_aulas").select("*").gte("aula_date",start).lte("aula_date",end).order("aula_date").order("start_time"),
   supabase.from("oficina_turmas").select("*").eq("active",true).order("weekday").order("start_time"),
   supabase.from("oficina_despesas").select("*").gte("expense_date",start).lte("expense_date",end).order("expense_date")
  ]);
  if(dueError||paidError||aulaError||turmaError||expenseError){
   setError(dueError?.message||paidError?.message||aulaError?.message||turmaError?.message||expenseError?.message||"Não foi possível carregar o financeiro.");
   setLoading(false);
   return;
  }
  const merged=new Map<string,Payment>();
  for(const p of [...(pDue||[]),...(pPaid||[])])merged.set(p.id,p as Payment);
  setPayments([...merged.values()].sort((a,b)=>String(a.due_date).localeCompare(String(b.due_date))));
  setAulas((a||[]) as Aula[]);
  setTurmas((t||[]) as Turma[]);
  setExpenses(e||[]);
  setLoading(false);
 }

 useEffect(()=>{void load()},[start,end]);

 const filteredPayments=useMemo(()=>payments.filter(p=>{
  const name=String(p.oficina_aluno_planos?.oficina_alunos?.full_name||"").toLowerCase();
  const responsible=String(p.oficina_aluno_planos?.oficina_alunos?.responsible_name||"").toLowerCase();
  return (statusFilter==="Todos"||p.status===statusFilter)&&(!search||name.includes(search.toLowerCase())||responsible.includes(search.toLowerCase()));
 }),[payments,search,statusFilter]);

 const recebido=payments.filter(p=>p.status==="Pago"&&p.paid_at&&String(p.paid_at).slice(0,7)===start.slice(0,7)).reduce((s,p)=>s+Number(p.amount),0);
 const aberto=payments.filter(p=>p.status==="Em aberto").reduce((s,p)=>s+Number(p.amount),0);
 const despesas=expenses.reduce((s,e)=>s+Number(e.amount),0);
 const realizadas=aulas.filter(a=>a.status==="realizada");
 const horas=realizadas.reduce((s,a)=>s+Number(a.duration_minutes)/60,0);
 const professoresTotal=realizadas.reduce((s,a)=>s+(Number(a.duration_minutes)/60)*Number(a.hourly_rate),0);

 const scheduleSummary=useMemo<ProfessorSchedule[]>(()=>{
  const map=new Map<string,ProfessorSchedule>();
  const daysInMonth=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  const workedDays=new Map<string,Set<string>>();
  for(let day=1;day<=daysInMonth;day++){
   const date=new Date(month.getFullYear(),month.getMonth(),day);
   const weekday=date.getDay()===0?7:date.getDay();
   const dateKey=localDate(date);
   for(const t of turmas){
    if(Number(t.weekday)!==weekday) continue;
    const name=t.teacher_name||"Professor não informado";
    const key=t.professor_id||name;
    const current=map.get(key)||{name,professor_id:t.professor_id,weeklyHours:0,monthlyHours:0,monthlyAmount:0,weeklyByDay:[0,0,0,0,0,0,0],classes:0,workDays:0,turmas:[]};
    const hours=Number(t.duration_minutes||0)/60;
    current.monthlyHours+=hours;
    current.monthlyAmount+=hours*Number(t.hourly_rate||0);
    current.classes+=1;
    if(!current.turmas.some(x=>x.id===t.id)) current.turmas.push(t);
    const dayIndex=Number(t.weekday)-1;
    if(dayIndex>=0&&dayIndex<7) current.weeklyByDay[dayIndex]+=hours;
    map.set(key,current);
    if(!workedDays.has(key)) workedDays.set(key,new Set());
    workedDays.get(key)!.add(dateKey);
   }
  }
  for(const t of turmas){
   const name=t.teacher_name||"Professor não informado";
   const key=t.professor_id||name;
   const current=map.get(key);
   if(!current) continue;
   current.weeklyHours+=Number(t.duration_minutes||0)/60;
  }
  for(const [key,current] of map) current.workDays=workedDays.get(key)?.size||0;
  return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name));
 },[turmas,month]);
 const scheduleWeeklyHours=scheduleSummary.reduce((s,p)=>s+p.weeklyHours,0);
 const scheduleMonthlyHours=scheduleSummary.reduce((s,p)=>s+p.monthlyHours,0);
 const scheduleMonthlyAmount=scheduleSummary.reduce((s,p)=>s+p.monthlyAmount,0);

 const professorSummary=useMemo(()=>{
  const map=new Map<string,{classes:number;hours:number;amount:number}>();
  for(const a of realizadas){
   const name=a.teacher_name||"Professor não informado";
   const current=map.get(name)||{classes:0,hours:0,amount:0};
   current.classes+=1;
   current.hours+=Number(a.duration_minutes)/60;
   current.amount+=(Number(a.duration_minutes)/60)*Number(a.hourly_rate);
   map.set(name,current);
  }
  return [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
 },[aulas]);

 async function markPaid(p:Payment){
  const {error}=await supabase.from("oficina_pagamentos").update({status:"Pago",paid_at:localDate(new Date())}).eq("id",p.id);
  if(error){setError(error.message);return}
  await load();
 }

 async function markOpen(p:Payment){
  const {error}=await supabase.from("oficina_pagamentos").update({status:"Em aberto",paid_at:null}).eq("id",p.id);
  if(error){setError(error.message);return}
  await load();
 }

 async function updatePayment(p:Payment,patch:any){
  const {error}=await supabase.from("oficina_pagamentos").update(patch).eq("id",p.id);
  if(error){setError(error.message);return}
  await load();
 }

 async function addExpense(e:React.FormEvent){
  e.preventDefault();
  const {error}=await supabase.from("oficina_despesas").insert({...expense,amount:Number(expense.amount)});
  if(error){setError(error.message);return}
  setShowExpense(false);
  setExpense({description:"",amount:"",category:"Operacional",payment_method:"Pix",expense_date:localDate(new Date())});
  await load();
 }

 function generateReport(){
  const professorRows=scheduleSummary.map(v=>"<tr><td>"+esc(v.name)+"</td><td>"+v.weeklyHours.toFixed(2).replace(".",",")+" h</td><td>"+v.monthlyHours.toFixed(2).replace(".",",")+" h</td><td>"+money(v.monthlyAmount)+"</td></tr>").join("");
  const paymentRows=payments.map(p=>"<tr><td>"+esc(p.oficina_aluno_planos?.oficina_alunos?.full_name||"—")+"</td><td>"+dateBR(p.due_date)+"</td><td>"+(p.paid_at?dateBR(p.paid_at):"—")+"</td><td>"+esc(p.status)+"</td><td>"+money(Number(p.amount))+"</td></tr>").join("");
  const classRows=realizadas.map(a=>"<tr><td>"+dateBR(a.aula_date)+"</td><td>"+esc(days[new Date(a.aula_date+"T12:00:00").getDay()] ?? "—")+"</td><td>"+esc(a.teacher_name||"—")+"</td><td>"+String(a.start_time||"").slice(0,5)+"</td><td>"+a.duration_minutes+" min</td><td>"+money((Number(a.duration_minutes)/60)*Number(a.hourly_rate))+"</td></tr>").join("");
  const expenseRows=expenses.map(e=>"<tr><td>"+dateBR(e.expense_date)+"</td><td>"+esc(e.description||"—")+"</td><td>"+esc(e.category||"—")+"</td><td>"+money(Number(e.amount))+"</td></tr>").join("");
  const html="<!doctype html><html><head><meta charset='utf-8'><title>Relatório Financeiro - "+monthLabel(month)+"</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{margin:0 0 4px}h2{margin-top:28px;font-size:18px}p{color:#666}table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}.cards{display:flex;gap:12px;margin:20px 0}.card{border:1px solid #ddd;border-radius:10px;padding:12px;flex:1}.value{font-size:20px;font-weight:700;margin-top:4px}@media print{body{padding:12px}.no-print{display:none}}</style></head><body><h1>Relatório Financeiro</h1><p>Projeto Oficina · "+monthLabel(month)+"</p><div class='cards'><div class='card'>Recebido<div class='value'>"+money(recebido)+"</div></div><div class='card'>Em aberto<div class='value'>"+money(aberto)+"</div></div><div class='card'>Despesas<div class='value'>"+money(despesas)+"</div></div><div class='card'>Professores<div class='value'>"+money(professoresTotal)+"</div></div></div><h2>Pagamentos dos alunos</h2><table><thead><tr><th>Aluno</th><th>Vencimento</th><th>Pago em</th><th>Status</th><th>Valor</th></tr></thead><tbody>"+paymentRows+"</tbody></table><h2>Horas previstas dos professores</h2><table><thead><tr><th>Professor</th><th>Horas/semana</th><th>Horas no mês</th><th>Valor previsto</th></tr></thead><tbody>"+(professorRows||"<tr><td colspan='4'>Nenhuma aula realizada.</td></tr>")+"</tbody></table><h2>Aulas realizadas</h2><table><thead><tr><th>Data</th><th>Dia</th><th>Professor</th><th>Horário</th><th>Duração</th><th>Valor</th></tr></thead><tbody>"+(classRows||"<tr><td colspan='6'>Nenhuma aula realizada.</td></tr>")+"</tbody></table><h2>Despesas</h2><table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead><tbody>"+(expenseRows||"<tr><td colspan='4'>Nenhuma despesa.</td></tr>")+"</tbody></table><p style='margin-top:30px'>Relatório gerado em "+new Date().toLocaleString("pt-BR")+".</p></body></html>";
  const popup=window.open("","_blank");
  if(!popup){window.alert("Permita pop-ups para gerar o relatório.");return}
  popup.document.write(html);
  popup.document.close();
  setTimeout(()=>popup.print(),300);
 }

 return <AuthGuard><div className="min-h-screen bg-white"><TopBar/><div className="flex min-h-[calc(100vh-64px)]"><OficinaSidebar/><div className="min-w-0 flex-1"><main className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl">
  <header className="mb-6"><p className="text-xs font-semibold uppercase tracking-[.12em] text-black/40">Projeto Oficina</p><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="mt-1 text-[30px] font-bold text-[#111827]">Financeiro</h1><p className="mt-1 text-sm text-black/50">Controle mensal dos pagamentos dos alunos e das horas dos professores.</p></div><div className="flex items-center gap-2"><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))} className="rounded-lg border px-3 py-2">‹</button><span className="min-w-[170px] text-center px-2 py-2 text-sm capitalize">{monthLabel(month)}</span><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))} className="rounded-lg border px-3 py-2">›</button></div></div></header>

  {error&&<div className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

  <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
   <Card label="Recebido dos alunos" value={money(recebido)} icon={<WalletCards size={18}/>}/>
   <Card label="Em aberto" value={money(aberto)} icon={<CircleDollarSign size={18}/>}/>
   <Card label="Horas previstas no mês" value={scheduleMonthlyHours.toFixed(1)+" h"} icon={<Clock3 size={18}/>}/>
   <Card label="A pagar aos professores" value={money(scheduleMonthlyAmount)} icon={<Users size={18}/>}/>
  </div>

  <div className="mb-5 flex flex-wrap gap-2"><button onClick={()=>setTab("pagamentos")} className={"rounded-xl px-4 py-2.5 text-sm font-medium "+(tab==="pagamentos"?"bg-[#111827] text-white":"border border-black/10")}>Pagamentos dos alunos</button><button onClick={()=>setTab("professores")} className={"rounded-xl px-4 py-2.5 text-sm font-medium "+(tab==="professores"?"bg-[#111827] text-white":"border border-black/10")}>Horas dos professores</button><button onClick={generateReport} className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium"><FileText size={16}/> Gerar relatório</button><button onClick={()=>setShowExpense(true)} className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium"><Plus size={16}/> Nova despesa</button></div>

  {tab==="pagamentos"&&<section className="overflow-hidden rounded-2xl border border-black/10 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 p-4"><div><h2 className="font-semibold">Alunos do mês</h2><p className="mt-1 text-xs text-black/45">Marque cada cobrança como paga. O pagamento fica registrado na competência deste mês.</p></div><div className="flex gap-2"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar aluno..." className="h-9 rounded-lg border border-black/10 px-3 text-sm"/><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="h-9 rounded-lg border border-black/10 px-3 text-sm"><option>Todos</option><option>Em aberto</option><option>Pago</option><option>Cancelado</option></select></div></div>
   {loading?<div className="p-10 text-center text-sm text-black/45">Carregando alunos...</div>:<div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="p-4 text-left">Aluno</th><th className="p-4 text-left">Plano</th><th className="p-4 text-left">Vencimento</th><th className="p-4 text-left">Valor</th><th className="p-4 text-left">Forma</th><th className="p-4 text-left">Professor</th><th className="p-4 text-left">Status</th><th className="p-4 text-right">Ação</th></tr></thead><tbody>{filteredPayments.map(p=><tr key={p.id} className="border-t border-black/10 hover:bg-gray-50"><td className="p-4"><strong>{p.oficina_aluno_planos?.oficina_alunos?.full_name||"Aluno não informado"}</strong>{p.oficina_aluno_planos?.oficina_alunos?.responsible_name&&<span className="block text-xs text-black/40">{p.oficina_aluno_planos.oficina_alunos.responsible_name}</span>}</td><td className="p-4">{p.oficina_aluno_planos?.oficina_planos?.name||"—"}</td><td className="p-4"><input type="date" value={p.due_date} onChange={e=>void updatePayment(p,{due_date:e.target.value})} className="h-9 rounded-lg border border-black/10 px-2 text-xs"/></td><td className="p-4"><input type="number" min="0" step=".01" value={p.amount} onChange={e=>setPayments(prev=>prev.map(x=>x.id===p.id?{...x,amount:Number(e.target.value)}:x))} onBlur={e=>void updatePayment(p,{amount:Number(e.target.value)})} className="h-9 w-28 rounded-lg border border-black/10 px-2 text-xs font-semibold"/></td><td className="p-4"><select value={p.payment_method||""} onChange={e=>void updatePayment(p,{payment_method:e.target.value||null})} className="h-9 rounded-lg border border-black/10 px-2 text-xs"><option value="">Não informado</option><option>PIX - CNPJ</option><option>PIX - Professor</option><option>Dinheiro</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Transferência</option><option>Boleto</option></select></td><td className="p-4">{p.oficina_aluno_planos?.oficina_professores?.name||"—"}</td><td className="p-4"><span className={"rounded-full border px-2.5 py-1 text-xs font-semibold "+(p.status==="Pago"?"border-emerald-200 bg-emerald-50 text-emerald-700":p.status==="Cancelado"?"border-gray-200 bg-gray-50 text-gray-600":"border-amber-200 bg-amber-50 text-amber-700")}>{p.status}</span>{p.paid_at&&<span className="mt-1 block text-xs text-black/40">{dateBR(p.paid_at)}</span>}</td><td className="p-4 text-right">{p.status==="Pago"?<button onClick={()=>void markOpen(p)} className="rounded-lg border border-black/10 px-3 py-2 text-xs">Desmarcar pago</button>:<button onClick={()=>void markPaid(p)} className="inline-flex items-center gap-1 rounded-lg bg-[#111827] px-3 py-2 text-xs text-white"><Check size={14}/> Marcar pago</button>}</td></tr>)}{!filteredPayments.length&&<tr><td colSpan={8} className="p-10 text-center text-sm text-black/45">Nenhum aluno encontrado neste mês.</td></tr>}</tbody></table></div>}
  </section>}

  {tab==="professores"&&<div className="grid gap-5 lg:grid-cols-2">
  <section className="rounded-2xl border border-black/10 bg-white lg:col-span-2">
   <div className="border-b border-black/10 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Carga horária dos professores</h2><p className="mt-1 text-xs text-black/45">Calculada pelas turmas ativas e pelos dias da semana cadastrados.</p></div><div className="text-right"><p className="text-xs text-black/45">Horas semanais</p><strong>{scheduleWeeklyHours.toFixed(2).replace(".",",")} h</strong></div></div></div>
   <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="p-4 text-left">Professor</th>{["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map(d=><th key={d} className="p-4 text-center">{d}</th>)}<th className="p-4 text-right">Semana</th><th className="p-4 text-right">Mês</th><th className="p-4 text-right">Valor</th></tr></thead><tbody>{scheduleSummary.map(v=><tr key={v.professor_id||v.name} className="border-t border-black/10"><td className="p-4"><strong>{v.name}</strong><span className="block text-xs text-black/40">{v.classes} aula(s) previstas · {v.workDays} dia(s) de trabalho · {v.turmas.length} turma(s)</span></td>{v.weeklyByDay.map((h,i)=><td key={i} className="p-4 text-center">{h?h.toFixed(2).replace(".",",")+" h":"—"}</td>)}<td className="p-4 text-right font-semibold">{v.weeklyHours.toFixed(2).replace(".",",")} h</td><td className="p-4 text-right font-semibold">{v.monthlyHours.toFixed(2).replace(".",",")} h</td><td className="p-4 text-right font-semibold">{money(v.monthlyAmount)}</td></tr>)}{!scheduleSummary.length&&<tr><td colSpan={11} className="p-8 text-center text-sm text-black/45">Nenhuma turma ativa cadastrada.</td></tr>}</tbody></table></div>
   <div className="grid gap-3 border-t border-black/10 p-4 sm:grid-cols-3"><div className="rounded-xl bg-black/[.035] p-3"><p className="text-xs text-black/45">Carga semanal</p><strong className="mt-1 block">{scheduleWeeklyHours.toFixed(2).replace(".",",")} h</strong></div><div className="rounded-xl bg-black/[.035] p-3"><p className="text-xs text-black/45">Carga da competência</p><strong className="mt-1 block">{scheduleMonthlyHours.toFixed(2).replace(".",",")} h</strong></div><div className="rounded-xl bg-black/[.035] p-3"><p className="text-xs text-black/45">Valor previsto aos professores</p><strong className="mt-1 block">{money(scheduleMonthlyAmount)}</strong></div></div>
  </section>
  <section className="rounded-2xl border border-black/10 bg-white lg:col-span-2"><div className="border-b border-black/10 p-4"><h2 className="font-semibold">Aulas realizadas</h2><p className="mt-1 text-xs text-black/45">Conferência do que foi efetivamente realizado no mês. Não altera a carga horária prevista.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="p-4 text-left">Data</th><th className="p-4 text-left">Dia</th><th className="p-4 text-left">Professor</th><th className="p-4 text-left">Horário</th><th className="p-4 text-left">Duração</th><th className="p-4 text-right">Valor</th></tr></thead><tbody>{realizadas.map(a=><tr key={a.id} className="border-t border-black/10"><td className="p-4">{dateBR(a.aula_date)}</td><td className="p-4">{days[new Date(a.aula_date+"T12:00:00").getDay()]}</td><td className="p-4">{a.teacher_name||"—"}</td><td className="p-4">{String(a.start_time||"").slice(0,5)}</td><td className="p-4">{a.duration_minutes} min</td><td className="p-4 text-right font-semibold">{money((Number(a.duration_minutes)/60)*Number(a.hourly_rate))}</td></tr>)}{!realizadas.length&&<tr><td colSpan={6} className="p-8 text-center text-sm text-black/45">Nenhuma aula realizada neste mês.</td></tr>}</tbody></table></div></section>
 </div>}

  <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Histórico financeiro da competência</h2><p className="mt-1 text-xs text-black/45">O mês selecionado no topo controla os pagamentos, aulas, professores e despesas exibidos.</p></div><div className="text-right"><p className="text-xs text-black/45">Despesas</p><strong>{money(despesas)}</strong></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs text-emerald-700">Recebido</p><strong className="mt-1 block text-lg text-emerald-800">{money(recebido)}</strong></div><div className="rounded-xl bg-amber-50 p-4"><p className="text-xs text-amber-700">Em aberto</p><strong className="mt-1 block text-lg text-amber-800">{money(aberto)}</strong></div><div className="rounded-xl bg-gray-100 p-4"><p className="text-xs text-gray-600">A pagar aos professores</p><strong className="mt-1 block text-lg text-gray-800">{money(professoresTotal)}</strong></div></div></section>

  <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Despesas do mês</h2><p className="mt-1 text-xs text-black/45">Despesas entram no histórico e no relatório financeiro.</p></div><button onClick={()=>setShowExpense(true)} className="rounded-xl border border-black/10 px-3 py-2 text-xs font-medium">Nova despesa</button></div>{expenses.map(x=><div key={x.id} className="flex justify-between border-b border-black/10 py-3 text-sm last:border-0"><div><span className="font-medium">{x.description}</span><span className="ml-2 text-xs text-black/40">{dateBR(x.expense_date)} · {x.category||"Operacional"} · {x.payment_method||"—"}</span></div><strong>{money(Number(x.amount))}</strong></div>)}{!expenses.length&&<p className="mt-4 text-sm text-black/45">Nenhuma despesa neste mês.</p>}</section>
 </div></main></div>
 {showExpense&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><form onSubmit={addExpense} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 className="font-semibold">Nova despesa</h2><button type="button" onClick={()=>setShowExpense(false)}><X size={18}/></button></div><div className="grid gap-4">{F("Descrição",<input required value={expense.description} onChange={e=>setExpense({...expense,description:e.target.value})}/>)}{F("Valor",<input required type="number" step=".01" value={expense.amount} onChange={e=>setExpense({...expense,amount:e.target.value})}/>)}{F("Categoria",<input value={expense.category} onChange={e=>setExpense({...expense,category:e.target.value})}/>)}{F("Forma de pagamento",<select value={expense.payment_method} onChange={e=>setExpense({...expense,payment_method:e.target.value})}><option>Pix</option><option>Cartão</option><option>Dinheiro</option><option>Transferência</option></select>)}{F("Data",<input required type="date" value={expense.expense_date} onChange={e=>setExpense({...expense,expense_date:e.target.value})}/>)}<button className="rounded-xl bg-[#111827] py-3 text-sm text-white">Salvar despesa</button></div></form></div>}
</div></div></AuthGuard>
}

function F(label:string,child:React.ReactNode){return <label><span className="mb-1.5 block text-xs text-black/55">{label}</span><div className="[&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-black/10 [&_input]:px-3 [&_input]:py-2.5 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-black/10 [&_select]:px-3 [&_select]:py-2.5">{child}</div></label>}
function Card(p:{label:string;value:string;icon:React.ReactNode}){return <div className="rounded-2xl border border-black/10 p-5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/5">{p.icon}</div><p className="mt-4 text-xs text-black/45">{p.label}</p><p className="mt-1 text-2xl font-bold">{p.value}</p></div>}
function esc(v:string){return v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
