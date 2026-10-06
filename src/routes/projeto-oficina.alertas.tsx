import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, CheckCircle2, CreditCard, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { TopBar } from "@/components/TopBar";
import { OficinaSidebar } from "@/components/OficinaSidebar";
import { supabase } from "@/integrations/supabase/client";

export const Route=createFileRoute("/projeto-oficina/alertas")({component:Alertas});
const fmt=(d:string|null)=>d?new Intl.DateTimeFormat("pt-BR").format(new Date(d+"T12:00:00")):"—";
const money=(v:any)=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const days=(d:string)=>Math.ceil((new Date(d+"T12:00:00").getTime()-new Date(new Date().toISOString().slice(0,10)+"T12:00:00").getTime())/86400000);
const monthLabel=(value:string)=>{const [year=0,month=1]=value.split("-").map(Number);return new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(new Date(year,month-1,1)).replace(/^./,c=>c.toUpperCase())};
const shiftMonth=(value:string,delta:number)=>{const [year=0,month=1]=value.split("-").map(Number);const d=new Date(year,month-1+delta,1);return d.toISOString().slice(0,7)};
function Badge({tone,children}:{tone:string;children:any}){const c=tone==="danger"?"bg-red-100 text-red-700 ring-red-200":tone==="warning"?"bg-amber-100 text-amber-800 ring-amber-200":tone==="ok"?"bg-emerald-100 text-emerald-700 ring-emerald-200":"bg-slate-100 text-slate-600 ring-slate-200";return <span className={"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 "+c}>{children}</span>}
function urgency(n:number){return n<0?["danger",`Vencido há ${Math.abs(n)} dia(s)`]:n===0?["danger","Vence hoje"]:n<=7?["warning",`Vence em ${n} dia(s)`]:["neutral",`Vence em ${n} dias`]}
function initials(name:string){return name.split(" ").filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()}

function Alertas(){
 const [data,setData]=useState<any>({students:[],plans:[],studentPlans:[],payments:[]}),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const initialMonth=(()=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-1);return d.toISOString().slice(0,7)})();
 const [selectedMonth,setSelectedMonth]=useState(initialMonth);
 async function load(){
  setLoading(true);setError("");
  const [s,pl,sp,p]=await Promise.all([
   supabase.from("oficina_alunos").select("*").eq("active",true).order("full_name"),
   supabase.from("oficina_planos").select("*").eq("active",true),
   supabase.from("oficina_aluno_planos").select("*").eq("status","Ativo"),
   supabase.from("oficina_pagamentos").select("*").order("due_date")
  ]);
  const e=[s,pl,sp,p].find(x=>x.error)?.error;if(e)setError(e.message);
  setData({students:s.data||[],plans:pl.data||[],studentPlans:sp.data||[],payments:p.data||[]});setLoading(false);
 }
 useEffect(()=>{void load()},[]);
 const m=useMemo(()=>{
  const students=new Map<string,any>(data.students.map((x:any)=>[x.id,x]));
  const aps=new Map<string,any>(data.studentPlans.map((x:any)=>[x.id,x]));
  const plans=new Map<string,any>(data.plans.map((x:any)=>[x.id,x]));
  const planByStudent=new Map<string,any>();data.studentPlans.forEach((x:any)=>{if(!planByStudent.has(x.aluno_id))planByStudent.set(x.aluno_id,x)});
   const [selectedYear=0,selectedMonthNumber=1]=selectedMonth.split("-").map(Number);
  const selectedStart=new Date(selectedYear,selectedMonthNumber-1,1);
  const selectedEnd=new Date(selectedYear,selectedMonthNumber,0);
  const ps=selectedStart.toISOString().slice(0,10),pe=selectedEnd.toISOString().slice(0,10);
  const paymentAlerts=data.payments.filter((x:any)=>aps.has(x.aluno_plano_id)&&x.status!=="Pago"&&x.status!=="Cancelado"&&x.due_date>=ps&&x.due_date<=pe).map((x:any)=>({...x,studentPlan:aps.get(x.aluno_plano_id),student:students.get(aps.get(x.aluno_plano_id)?.aluno_id)})).filter((x:any)=>x.student);
  const currentAlerts=data.payments.filter((x:any)=>students.has(aps.get(x.aluno_plano_id)?.aluno_id)&&x.status!=="Pago"&&x.status!=="Cancelado"&&days(x.due_date)<=7&&days(x.due_date)>=-60).map((x:any)=>({...x,studentPlan:aps.get(x.aluno_plano_id),student:students.get(aps.get(x.aluno_plano_id)?.aluno_id)})).filter((x:any)=>x.student).sort((a:any,b:any)=>a.due_date.localeCompare(b.due_date));
  const planAlerts=data.studentPlans.map((x:any)=>{const student=students.get(x.aluno_id),plan=plans.get(x.plano_id);return {...x,student,plan,left:x.end_date?days(x.end_date):null}}).filter((x:any)=>x.student&&x.end_date&&x.left<=15).sort((a:any,b:any)=>a.end_date.localeCompare(b.end_date));
  const noPlan=data.students.filter((x:any)=>!planByStudent.has(x.id));
  const noCharge=data.students.filter((x:any)=>{const ap=planByStudent.get(x.id);return ap&&!data.payments.some((p:any)=>p.aluno_plano_id===ap.id)});
  return {students,aps,plans,paymentAlerts,currentAlerts,planAlerts,noPlan,noCharge,selectedLabel:monthLabel(selectedMonth)};
 },[data,selectedMonth]);
 const sendCharge=(x:any)=>{const phone=String(x.student?.whatsapp||x.student?.phone||"").replace(/\D/g,"");if(!phone){setError("O aluno não possui telefone/WhatsApp cadastrado.");return}const p=phone.startsWith("55")?phone:"55"+phone;const text=`Olá! Tudo bem? Passando para lembrar a cobrança da Oficina no valor de ${money(x.amount)}, com vencimento em ${fmt(x.due_date)}.`;window.open("https://wa.me/"+p+"?text="+encodeURIComponent(text),"_blank","noopener,noreferrer")};
 if(loading)return <AuthGuard><div className="p-8 text-center text-sm text-black/45">Carregando central de alertas...</div></AuthGuard>;
 return <AuthGuard><div className="min-h-screen bg-white"><TopBar/><div className="flex min-h-[calc(100vh-64px)]"><OficinaSidebar/><div className="min-w-0 flex-1 overflow-x-hidden"><main className="p-4 sm:p-5 lg:p-6"><div className="mx-auto w-full max-w-[1400px]">
  <header className="mb-6"><p className="text-xs font-semibold uppercase tracking-[.12em] text-black/40">Projeto Oficina</p><h1 className="mt-1 text-[28px] font-bold leading-tight text-[#111827]">Central de Alertas</h1><p className="mt-2 text-sm text-black/55">Acompanhe cobranças, vencimentos e pendências dos alunos da Oficina.</p></header>
  {error&&<div className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
  <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Card icon={<CreditCard size={18}/>} label="Cobranças pendentes" value={m.currentAlerts.length}/><Card icon={<CalendarClock size={18}/>} label="Planos em vencimento" value={m.planAlerts.length}/><Card icon={<AlertTriangle size={18}/>} label="Itens vencidos" value={m.currentAlerts.filter((x:any)=>days(x.due_date)<0).length}/><Card icon={<UsersRound size={18}/>} label="Alunos sem plano" value={m.noPlan.length}/></div>

  <section className="mb-6 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
   <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div>
     <p className="text-xs font-semibold uppercase tracking-[.1em] text-black/40">Período das mensalidades</p>
     <h2 className="mt-1 text-base font-bold tracking-tight text-black/80">Visualizar alertas por mês</h2>
     <p className="mt-1 text-sm text-black/50">Selecione o mês para consultar somente as mensalidades pendentes daquele período.</p>
    </div>
    <div className="flex items-center gap-2">
     <button type="button" onClick={()=>setSelectedMonth(shiftMonth(selectedMonth,-1))} className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50" aria-label="Mês anterior">‹</button>
     <input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 outline-none focus:border-gray-400"/>
     <button type="button" onClick={()=>setSelectedMonth(shiftMonth(selectedMonth,1))} className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50" aria-label="Próximo mês">›</button>
    </div>
   </div>
  </section>

  <Section title={`Mensalidades pendentes — ${m.selectedLabel}`} count={m.paymentAlerts.length}><Table><thead><tr><th>Aluno</th><th>Vencimento</th><th>Valor</th><th>Forma</th><th>Destino</th><th>Status</th><th>Ação</th></tr></thead><tbody>{m.paymentAlerts.map((x:any)=>{const u=urgency(days(x.due_date));return <tr key={x.id}><td><Student name={x.student.full_name} id={x.student.id}/></td><td>{fmt(x.due_date)}</td><td>{money(x.amount)}</td><td>{x.payment_method||"—"}</td><td>{x.destination||"—"}</td><td><Badge tone={u[0] as string}>{u[1]} · {x.status}</Badge></td><td><div className="flex gap-2"><button onClick={()=>sendCharge(x)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium">Enviar cobrança</button><Link to="/projeto-oficina/alunos/$alunoId" params={{alunoId:x.student.id}} className="px-2 py-1.5 text-xs font-medium underline">Abrir</Link></div></td></tr>})}{!m.paymentAlerts.length&&<tr><td colSpan={7} className="p-8 text-center text-black/45">Nenhuma mensalidade do mês anterior está pendente.</td></tr>}</tbody></Table></Section>

  <Section title="Cobranças vencidas e próximas" count={m.currentAlerts.length}><Table><thead><tr><th>Aluno</th><th>Vencimento</th><th>Valor</th><th>Forma</th><th>Destino</th><th>Status</th><th>Ação</th></tr></thead><tbody>{m.currentAlerts.map((x:any)=>{const u=urgency(days(x.due_date));return <tr key={x.id}><td><Student name={x.student.full_name} id={x.student.id}/></td><td>{fmt(x.due_date)}</td><td>{money(x.amount)}</td><td>{x.payment_method||"—"}</td><td>{x.destination||"—"}</td><td><Badge tone={u[0] as string}>{u[1]}</Badge></td><td><div className="flex gap-2"><button onClick={()=>sendCharge(x)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium">Enviar lembrete</button><Link to="/projeto-oficina/alunos/$alunoId" params={{alunoId:x.student.id}} className="text-xs font-medium underline">Atualizar</Link></div></td></tr>})}{!m.currentAlerts.length&&<tr><td colSpan={7} className="p-8 text-center text-black/45">Nenhuma cobrança vencida ou próxima do vencimento.</td></tr>}</tbody></Table></Section>

  <Section title="Vigências dos planos" count={m.planAlerts.length}><Table><thead><tr><th>Aluno</th><th>Plano</th><th>Vigência</th><th>Validade</th><th>Status</th><th>Ação</th></tr></thead><tbody>{m.planAlerts.map((x:any)=>{const u=urgency(x.left);return <tr key={x.id}><td><Student name={x.student.full_name} id={x.student.id}/></td><td>{x.plan?.name||"—"}</td><td>{fmt(x.start_date)} a {fmt(x.end_date)}</td><td>{fmt(x.end_date)}</td><td><Badge tone={u[0] as string}>{u[1]}</Badge></td><td><Link to="/projeto-oficina/alunos/$alunoId" params={{alunoId:x.student.id}} className="text-xs font-medium underline">Abrir perfil</Link></td></tr>})}{!m.planAlerts.length&&<tr><td colSpan={6} className="p-8 text-center text-black/45">Nenhum plano vence nos próximos 15 dias.</td></tr>}</tbody></Table></Section>

  <Section title="Alunos sem plano ou sem cobrança" count={m.noPlan.length+m.noCharge.length}><Table><thead><tr><th>Aluno</th><th>Responsável</th><th>Pendência</th><th>Ação</th></tr></thead><tbody>{[...m.noPlan.map((x:any)=>({...x,kind:"Sem plano"})),...m.noCharge.map((x:any)=>({...x,kind:"Sem cobrança gerada"}))].map((x:any)=><tr key={x.id+"-"+x.kind}><td><Student name={x.full_name} id={x.id}/></td><td>{x.responsible_name||"—"}</td><td><Badge tone="warning">{x.kind}</Badge></td><td><Link to="/projeto-oficina/alunos/$alunoId" params={{alunoId:x.id}} className="text-xs font-medium underline">Abrir perfil</Link></td></tr>)}{!m.noPlan.length&&!m.noCharge.length&&<tr><td colSpan={4} className="p-8 text-center text-black/45">Todos os alunos ativos possuem plano e cobrança.</td></tr>}</tbody></Table></Section>
 </div></main></div></div></div></AuthGuard>;
}
function Card({icon,label,value}:{icon:any;label:string;value:number}){return <article className="min-h-[118px] rounded-xl border border-black/10 bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)]"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/[.045] text-black/65">{icon}</div><div className="mt-3 flex items-end justify-between gap-3"><div><p className="text-[13px] font-medium text-black/45">{label}</p><p className="mt-1 text-[28px] font-bold leading-none tracking-tight text-[#111827]">{value}</p></div></div></article>}
function Section({title,count,children}:{title:string;count:number;children:any}){return <section className="mb-6"><div className="mb-3 flex items-center gap-2"><h2 className="text-base font-bold tracking-tight text-black/80">{title}</h2><span className="text-sm font-semibold text-black/45">{count}</span></div><div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">{children}</div></section>}
function Table({children}:{children:any}){return <table className="w-full min-w-[760px] table-fixed text-left text-[13px] [&_thead]:bg-gray-50 [&_th]:px-3 [&_th]:py-3 [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-gray-500 [&_tbody_tr]:border-t [&_tbody_tr]:border-gray-100 [&_td]:px-3 [&_td]:py-2.5">{children}</table>}
function Student({name,id}:{name:string;id:string}){return <Link to="/projeto-oficina/alunos/$alunoId" params={{alunoId:id}} className="flex items-center gap-2.5 py-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F2F2F7] text-[10px] font-bold">{initials(name)}</span><span><strong className="block text-[13px] leading-tight">{name}</strong><span className="text-[11px] text-black/40">Aluno ativo</span></span></Link>}
