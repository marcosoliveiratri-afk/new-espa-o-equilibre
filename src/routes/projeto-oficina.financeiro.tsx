import { createFileRoute } from "@tanstack/react-router";
import { CircleDollarSign, Plus, WalletCards, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { TopBar } from "@/components/TopBar";
import { OficinaSidebar } from "@/components/OficinaSidebar";
import { supabase } from "@/integrations/supabase/client";

export const Route=createFileRoute("/projeto-oficina/financeiro")({component:Financeiro});
const money=(v:any)=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const localDate=(d:Date)=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`};
const fmt=(d:string|null)=>d?new Intl.DateTimeFormat("pt-BR").format(new Date(d+"T12:00:00")):"—";
function Financeiro(){
 const [payments,setPayments]=useState<any[]>([]),[expenses,setExpenses]=useState<any[]>([]),[month,setMonth]=useState(()=>new Date()),[showExpense,setShowExpense]=useState(false),[error,setError]=useState(""),[generating,setGenerating]=useState(false);
 const [expense,setExpense]=useState({description:"",amount:"",category:"Operacional",payment_method:"Pix",expense_date:new Date().toISOString().slice(0,10)});
 const start=localDate(new Date(month.getFullYear(),month.getMonth(),1)),end=localDate(new Date(month.getFullYear(),month.getMonth()+1,0));
 async function ensureMonthlyCharges(){
  const now=new Date();
  if(month.getFullYear()!==now.getFullYear()||month.getMonth()!==now.getMonth())return;
  if(generating)return;
  setGenerating(true);
  try{
   const target=new Date(month.getFullYear(),month.getMonth(),1);
   const monthKey=localDate(target).slice(0,7);
   const {data:plans,error:plansError}=await supabase.from("oficina_aluno_planos").select("id,start_date,end_date,due_day,agreed_value,status,payment_method,destination,oficina_planos(duration_months)").eq("status","Ativo");
   if(plansError)throw plansError;
   const {data:existing,error:existingError}=await supabase.from("oficina_pagamentos").select("aluno_plano_id,due_date").gte("due_date",start).lte("due_date",end);
   if(existingError)throw existingError;
   const existingKeys=new Set((existing||[]).map(x=>`${x.aluno_plano_id}|${String(x.due_date).slice(0,7)}`));
   const rows:any[]=[];
   for(const p of plans||[]){
    const startDate=new Date(p.start_date+"T12:00:00");
    const endDate=p.end_date?new Date(p.end_date+"T12:00:00"):null;
    if(startDate>new Date(month.getFullYear(),month.getMonth()+1,0) || (endDate&&endDate<target))continue;
    const diff=(target.getFullYear()-startDate.getFullYear())*12+target.getMonth()-startDate.getMonth();
    const duration=Math.max(1,Number(p.oficina_planos?.duration_months||1));
    if(diff<0||diff%duration!==0)continue;
    if(existingKeys.has(`${p.id}|${monthKey}`))continue;
    const day=Math.min(Number(p.due_day||10),new Date(target.getFullYear(),target.getMonth()+1,0).getDate());
    rows.push({aluno_plano_id:p.id,due_date:new Date(target.getFullYear(),target.getMonth(),day,12).toISOString().slice(0,10),amount:Number(p.agreed_value||0),payment_method:p.payment_method||null,destination:p.destination||"Oficina",status:"Em aberto"});
   }
   if(rows.length){
    const {error}=await supabase.from("oficina_pagamentos").insert(rows);
    if(error)throw error;
   }
  }catch(e:any){
   setError(e?.message||"Não foi possível gerar automaticamente as cobranças do mês.");
  }finally{setGenerating(false)}
 }
 async function load(){
  await ensureMonthlyCharges();
  const [{data:pDue,error:dueError},{data:pPaid,error:paidError},{data:e,error:ee}]=await Promise.all([
   supabase.from("oficina_pagamentos").select("*").gte("due_date",start).lte("due_date",end).order("due_date"),
   supabase.from("oficina_pagamentos").select("*").eq("status","Pago").gte("paid_at",start).lte("paid_at",end).order("paid_at"),
   supabase.from("oficina_despesas").select("*").gte("expense_date",start).lte("expense_date",end).order("expense_date")
  ]);
  if(dueError||paidError||ee){setError(dueError?.message||paidError?.message||ee?.message||"Não foi possível carregar o financeiro.");return}
  const merged=new Map<string,any>(); for(const p of [...(pDue||[]),...(pPaid||[])])merged.set(p.id,p);
  setPayments([...merged.values()].sort((a,b)=>String(a.due_date).localeCompare(String(b.due_date))));
  setExpenses(e||[]);
 } useEffect(()=>{void load()},[start,end]);
 const recebido=payments.filter(x=>x.status==="Pago"&&x.paid_at&&String(x.paid_at).slice(0,7)===start.slice(0,7)).reduce((s,x)=>s+Number(x.amount),0),aberto=payments.filter(x=>x.status==="Em aberto").reduce((s,x)=>s+Number(x.amount),0),despesas=expenses.reduce((s,x)=>s+Number(x.amount),0);
 async function addExpense(e:React.FormEvent){e.preventDefault();const {error}=await supabase.from("oficina_despesas").insert({...expense,amount:Number(expense.amount)});if(error){setError(error.message);return}setShowExpense(false);setExpense({description:"",amount:"",category:"Operacional",payment_method:"Pix",expense_date:new Date().toISOString().slice(0,10)});await load()}
 return <AuthGuard><div className="min-h-screen bg-white"><TopBar/><div className="flex min-h-[calc(100vh-64px)]"><OficinaSidebar/><div className="min-w-0 flex-1"><main className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl">
  <header className="mb-6"><p className="text-xs font-semibold uppercase tracking-[.12em] text-black/40">Projeto Oficina</p><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="mt-1 text-[30px] font-bold text-[#111827]">Financeiro</h1><p className="mt-1 text-sm text-black/50">Cobranças, recebimentos, vencimentos, formas de pagamento e despesas.</p></div><div className="flex items-center gap-2"><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))} className="rounded-lg border px-3 py-2">‹</button><span className="min-w-[150px] text-center px-2 py-2 text-sm capitalize">{month.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</span><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))} className="rounded-lg border px-3 py-2">›</button></div></div></header>
  {error&&<div className={`mb-5 rounded-xl p-3 text-sm ${error.startsWith("Cobranças do mês geradas")?"bg-emerald-50 text-emerald-700":error.startsWith("Nenhum plano ativo")?"bg-amber-50 text-amber-700":"bg-red-50 text-red-700"}`}>{error}</div>}
  <div className="mb-6 flex flex-wrap gap-2"><button onClick={()=>setShowExpense(true)} className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium"><Plus size={16}/>Nova despesa</button></div>
  <div className="mb-6 grid gap-4 sm:grid-cols-3"><Card label="Recebido" value={money(recebido)} icon={<WalletCards size={18}/>}/><Card label="Em aberto" value={money(aberto)} icon={<CircleDollarSign size={18}/>}/><Card label="Despesas" value={money(despesas)} icon={<Plus size={18}/>}/></div>
  <section className="mt-6 rounded-2xl border border-black/10 p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Despesas</h2><strong>{money(despesas)}</strong></div>{expenses.map(x=><div key={x.id} className="flex justify-between border-b py-3 text-sm"><div><span className="font-medium">{x.description}</span><span className="ml-2 text-xs text-black/40">{fmt(x.expense_date)} · {x.category||"Operacional"} · {x.payment_method||"—"}</span></div><strong>{money(x.amount)}</strong></div>)}{!expenses.length&&<p className="mt-3 text-sm text-black/45">Nenhuma despesa neste mês.</p>}</section>
 </div></main></div>
 {showExpense&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><form onSubmit={addExpense} className="w-full max-w-lg rounded-2xl bg-white p-6"><div className="mb-5 flex justify-between"><h2 className="font-semibold">Nova despesa</h2><button type="button" onClick={()=>setShowExpense(false)}><X size={18}/></button></div><div className="grid gap-4">{F("Descrição",<input required value={expense.description} onChange={e=>setExpense({...expense,description:e.target.value})}/>)}{F("Valor",<input required type="number" step=".01" value={expense.amount} onChange={e=>setExpense({...expense,amount:e.target.value})}/>)}{F("Categoria",<input value={expense.category} onChange={e=>setExpense({...expense,category:e.target.value})}/>)}{F("Forma de pagamento",<select value={expense.payment_method} onChange={e=>setExpense({...expense,payment_method:e.target.value})}><option>Pix</option><option>Cartão</option><option>Dinheiro</option><option>Transferência</option></select>)}{F("Data",<input required type="date" value={expense.expense_date} onChange={e=>setExpense({...expense,expense_date:e.target.value})}/>)}<button className="rounded-xl bg-[#111827] py-3 text-sm text-white">Salvar despesa</button></div></form></div>}
</div></div> </AuthGuard>
}
function F(l:string,c:React.ReactNode){return <label><span className="mb-1.5 block text-xs text-black/55">{l}</span><div className="[&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-black/10 [&_input]:px-3 [&_input]:py-2.5 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-black/10 [&_select]:px-3 [&_select]:py-2.5">{c}</div></label>}
function Card(p:{label:string;value:string;icon:React.ReactNode}){return <div className="rounded-2xl border border-black/10 p-5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/5">{p.icon}</div><p className="mt-4 text-xs text-black/45">{p.label}</p><p className="mt-1 text-2xl font-bold">{p.value}</p></div>}
