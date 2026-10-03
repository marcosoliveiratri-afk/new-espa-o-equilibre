import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, CheckCircle2, CreditCard, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { TopBar } from "@/components/TopBar";
import { supabase } from "@/integrations/supabase/client";

export const Route=createFileRoute("/projeto-oficina/alertas")({component:Alertas});
const fmt=(d:string|null)=>d?new Intl.DateTimeFormat("pt-BR").format(new Date(d+"T12:00:00")):"—";
const money=(v:any)=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const days=(d:string)=>Math.ceil((new Date(d+"T12:00:00").getTime()-new Date(new Date().toISOString().slice(0,10)+"T12:00:00").getTime())/86400000);
function Badge({tone,children}:{tone:string;children:any}){const c=tone==="danger"?"bg-red-100 text-red-700 ring-red-200":tone==="warning"?"bg-amber-100 text-amber-800 ring-amber-200":tone==="ok"?"bg-emerald-100 text-emerald-700 ring-emerald-200":"bg-slate-100 text-slate-600 ring-slate-200";return <span className={"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 "+c}>{children}</span>}
function urgency(n:number){return n<0?["danger",`Vencido há ${Math.abs(n)} dia(s)`]:n===0?["danger","Vence hoje"]:n<=7?["warning",`Vence em ${n} dia(s)`]:["neutral",`Vence em ${n} dias`]}
function initials(name:string){return name.split(" ").filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()}

function Alertas(){
 const [data,setData]=useState<any>({students:[],plans:[],studentPlans:[],payments:[]}),[loading,setLoading]=useState(true),[error,setError]=useState("");
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
  const students=new Map(data.students.map((x:any)=>[x.id,x]));
  const aps=new Map(data.studentPlans.map((x:any)=>[x.id,x]));
  const plans=new Map(data.plans.map((x:any)=>[x.id,x]));
  const planByStudent=new Map<string,any>();data.studentPlans.forEach((x:any)=>{if(!planByStudent.has(x.aluno_id))planByStudent.set(x.aluno_id,x)});
  const previousStart=new Date();previousStart.setDate(1);previousStart.setMonth(previousStart.getMonth()-1);
  const previousEnd=new Date(previousStart.getFullYear(),previousStart.getMonth()+1,0);
  const ps=previousStart.toISOString().slice(0,10),pe=previousEnd.toISOString().slice(0,10);
  const paymentAlerts=data.payments.filter((x:any)=>aps.has(x.aluno_plano_id)&&x.status!=="Pago"&&x.status!=="Cancelado"&&x.due_date>=ps&&x.due_date<=pe).map((x:any)=>({...x,studentPlan:aps.get(x.aluno_plano_id),student:students.get(aps.get(x.aluno_plano_id)?.aluno_id)})).filter((x:any)=>x.student);
  const currentAlerts=data.payments.filter((x:any)=>students.has(aps.get(x.aluno_plano_id)?.aluno_id)&&x.status!=="Pago"&&x.status!=="Cancelado"&&days(x.due_date)<=7&&days(x.due_date)>=-60).map((x:any)=>({...x,studentPlan:aps.get(x.aluno_plano_id),student:students.get(aps.get(x.aluno_plano_id)?.aluno_id)})).filter((x:any)=>x.student).sort((a:any,b:any)=>a.due_date.localeCompare(b.due_date));
  const planAlerts=data.studentPlans.map((x:any)=>{const student=students.get(x.aluno_id),plan=plans.get(x.plano_id);return {...x,student,plan,left:x.end_date?days(x.end_date):null}}).filter((x:any)=>x.student&&x.end_date&&x.left<=15).sort((a:any,b:any)=>a.end_date.localeCompare(b.end_date));
  const noPlan=data.students.filter((x:any)=>!planByStudent.has(x.id));
  const noCharge=data.students.filter((x:any)=>{const ap=planByStudent.get(x.id);return ap&&!data.payments.some((p:any)=>p.aluno_plano_id===ap.id)});
  return {students,aps,plans,paymentAlerts,currentAlerts,planAlerts,noPlan,noCharge,previousLabel:new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(previousStart).replace(/^./,c=>c.toUpperCase())};
 },[data]);
 const sendCharge=(x:any)=>{const phone=String(x.student?.whatsapp||x.student?.phone||"").replace(/\D/g,"");if(!phone){setError("O aluno não possui telefone/WhatsApp cadastrado.");return}const p=phone.startsWith("55")?phone:"55"+phone;const text=`Olá! Tudo bem? Passando para lembrar a cobrança da Oficina no valor de ${money(x.amount)}, com vencimento em ${fmt(x.due_date)}.`;window.open("https://wa.me/"+p+"?text="+encodeURIComponent(text),"_blank","noopener,noreferrer")};
 if(loading)return <AuthGuard><div className="p-8 text-center text-sm text-black/45">Carregando central de alertas...</div></AuthGuard>;
 return <AuthGuard><div className="min-h-screen bg-white"><TopBar/><main className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl">
  <header className="mb-8"><p className="text-xs font-semibold uppercase tracking-[.12em] text-black/40">Projeto Oficina</p><h1 className="mt-1 text-[30px] font-bold text-[#111827]">Central de Alertas</h1><p className="mt-2 text-sm text-black/55">Acompanhe cobranças, vencimentos e pendências dos alunos da Oficina.</p></header>
  {error&&<div className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
  <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Card icon={<CreditCard size={18}/>} label="Cobranças pendentes" value={m.currentAlerts.length}/><Card icon={<CalendarClock size={18}/>} label="Planos em vencimento" value={m.planAlerts.length}/><Card icon={<AlertTriangle size={18}/>} label="Itens vencidos" value={m.currentAlerts.filter((x:any)=>days(x.due_date)<0).length}/><Card icon={<UsersRound size={18}/>} label="Alunos sem plano" value={m.noPlan.length}/></div>

  <Section title={`Mensalidades pendentes — ${m.previousLabel}`} count={m.paymentAlerts.length}><Table><thead><tr><th>Aluno</th><th>Vencimento</th><th>Valor</th><th>Forma</th><th>Destino</th><th>Status</th><th>Ação</th></tr></thead><tbody>{m.paymentAlerts.map((x:any)=>{const u=urgency(days(x.due_date));return <tr key={x.id}><td><Student name={x.student.full_name} id={x.student.id}/></td><td>{fmt(x.due_date)}</td><td>{money(x.amount)}</td><td>{x.payment_method||"—"}</td><td>{x.destination||"—"}</td><td><Badge tone={u[0]}>{u[1]} · {x.status}</Badge></td><td><div className="flex gap-2"><button onClick={()=>sendCharge(x)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium">Enviar cobrança</button><Link to="/projeto-oficina/alunos/$alunoId" params={{alunoId:x.student.id}} className="px-2 py-1.5 text-xs font-medium underline">Abrir</Link></div></td></tr>})}{!m.paymentAlerts.length&&<tr><td colSpan={7} className="p-8 text-center text-black/45">Nenhuma mensalidade do mês anterior está pendente.</td></tr>}</tbody></Table></Section>

  <Section title="Cobranças vencidas e próximas" count={m.currentAlerts.length}><Table><thead><tr><th>Aluno</th><th>Vencimento</th><th>Valor</th><th>Forma</th><th>Destino</th><th>Status</th><th>Ação</th></tr></thead><tbody>{m.currentAlerts.map((x:any)=>{const u=urgency(days(x.due_date));return <tr key={x.id}><td><Student name={x.student.full_name} id={x.student.id}/></td><td>{fmt(x.due_date)}</td><td>{money(x.amount)}</td><td>{x.payment_method||"—"}</td><td>{x.destination||"—"}</td><td><Badge tone={u[0]}>{u[1]}</Badge></td><td><div className="flex gap-2"><button onClick={()=>sendCharge(x)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium">Enviar lembrete</button><Link to="/projeto-oficina/alunos/$alunoId" params={{alunoId:x.student.id}} className="text-xs font-medium underline">Atualizar</Link></div></td></tr>})}{!m.currentAlerts.length&&<tr><td colSpan={7} className="p-8 text-center text-black/45">Nenhuma cobrança vencida ou próxima do vencimento.</td></tr>}</tbody></Table></Section>

  <Section title="Vigências dos planos" count={m.planAlerts.length}><Table><thead><tr><th>Aluno</th><th>Plano</th><th>Vigência</th><th>Validade</th><th>Status</th><th>Ação</th></tr></thead><tbody>{m.planAlerts.map((x:any)=>{const u=urgency(x.left);return <tr key={x.id}><td><Student name={x.student.full_name} id={x.student.id}/></td><td>{x.plan?.name||"—"}</td><td>{fmt(x.start_date)} a {fmt(x.end_date)}</td><td>{fmt(x.end_date)}</td><td><Badge tone={u[0]}>{u[1]}</Badge></td><td><Link to="/projeto-oficina/alunos/$alunoId" params={{alunoId:x.student.id}} className="text-xs font-medium underline">Abrir perfil</Link></td></tr>})}{!m.planAlerts.length&&<tr><td colSpan={6} className="p-8 text-center text-black/45">Nenhum plano vence nos próximos 15 dias.</td></tr>}</tbody></Table></Section>

  <Section title="Alunos sem plano ou sem cobrança" count={m.noPlan.length+m.noCharge.length}><Table><thead><tr><th>Aluno</th><th>Responsável</th><th>Pendência</th><th>Ação</th></tr></thead><tbody>{[...m.noPlan.map((x:any)=>({...x,kind:"Sem plano"})),...m.noCharge.map((x:any)=>({...x,kind:"Sem cobrança gerada"}))].map((x:any)=><tr key={x.id+"-"+x.kind}><td><Student name={x.full_name} id={x.id}/></td><td>{x.responsible_name||"—"}</td><td><Badge tone="warning">{x.kind}</Badge></td><td><Link to="/projeto-oficina/alunos/$alunoId" params={{alunoId:x.id}} className="text-xs font-medium underline">Abrir perfil</Link></td></tr>)}{!m.noPlan.length&&!m.noCharge.length&&<tr><td colSpan={4} className="p-8 text-center text-black/45">Todos os alunos ativos possuem plano e cobrança.</td></tr>}</tbody></Table></Section>
 </div></main></div></AuthGuard>;
}
function Card({icon,label,value}:{icon:any;label:string;value:number}){return <div className="rounded-2xl border border-gray-200 bg-white p-5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/5">{icon}</div><p className="mt-4 text-xs text-black/45">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>}
function Section({title,count,children}:{title:string;count:number;children:any}){return <section className="mb-8"><div className="mb-4 flex items-center gap-2"><h2 className="text-lg font-bold tracking-tight text-black/80">{title}</h2><span className="text-sm font-semibold text-black/45">{count}</span></div><div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">{children}</div></section>}
function Table({children}:{children:any}){return <table className="w-full min-w-[980px] text-left text-sm">{children}</table>}
function Student({name,id}:{name:string;id:string}){return <Link to="/projeto-oficina/alunos/$alunoId" params={{alunoId:id}} className="flex items-center gap-3 p-4"><span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[#F2F2F7] text-[11px] font-bold">{initials(name)}</span><span><strong className="block text-[13.5px]">{name}</strong><span className="text-[11.5px] text-black/40">Aluno ativo</span></span></Link>}
