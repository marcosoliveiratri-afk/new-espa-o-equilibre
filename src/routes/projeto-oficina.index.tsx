import { Link, createFileRoute } from "@tanstack/react-router";
import { Users, UserRound, Layers3, CalendarCheck2, WalletCards, CircleDollarSign, Clock3, AlertCircle, CheckCircle2, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { TopBar } from "@/components/TopBar";
import { OficinaSidebar } from "@/components/OficinaSidebar";
import { supabase } from "@/integrations/supabase/client";

export const Route=createFileRoute("/projeto-oficina/")({component:ProjetoOficina});

function ProjetoOficina(){
 const [stats,setStats]=useState({alunos:0,professores:0,turmas:0,realizadas:0,pendentes:0,naoRealizadas:0,receitas:0,aberto:0,professor:0,horas:0});
 const [loading,setLoading]=useState(true);

 async function load(){
  setLoading(true);
  const [a,p,t,au,pag]=await Promise.all([
   supabase.from("oficina_alunos").select("id",{count:"exact",head:true}).eq("active",true),
   supabase.from("oficina_professores").select("id",{count:"exact",head:true}).eq("active",true),
   supabase.from("oficina_turmas").select("id",{count:"exact",head:true}).eq("active",true),
   supabase.from("oficina_aulas").select("id,duration_minutes,hourly_rate,status").gte("aula_date",monthStart()).lte("aula_date",monthEnd()),
   supabase.from("oficina_pagamentos").select("amount,status").gte("due_date",monthStart()).lte("due_date",monthEnd())
  ]);
  const aulas=(au.data??[]) as any[], payments=(pag.data??[]) as any[];
  const realizadas=aulas.filter(x=>x.status==="realizada");
  const pendentes=aulas.filter(x=>x.status==="pendente");
  const naoRealizadas=aulas.filter(x=>x.status==="nao_realizada");
  const recebido=payments.filter(x=>x.status==="Pago").reduce((s,x)=>s+Number(x.amount||0),0);
  const emAberto=payments.filter(x=>x.status!=="Pago").reduce((s,x)=>s+Number(x.amount||0),0);
  setStats({alunos:a.count??0,professores:p.count??0,turmas:t.count??0,realizadas:realizadas.length,pendentes:pendentes.length,naoRealizadas:naoRealizadas.length,receitas:recebido,aberto:emAberto,professor:realizadas.reduce((s,x)=>s+(Number(x.duration_minutes||0)/60)*Number(x.hourly_rate||0),0),horas:realizadas.reduce((s,x)=>s+Number(x.duration_minutes||0)/60,0)});
  setLoading(false);
 }
 useEffect(()=>{void load()},[]);

 const cards=[
  {title:"Alunos",value:stats.alunos,icon:Users,to:"/projeto-oficina/alunos",desc:"alunos ativos"},
  {title:"Professores",value:stats.professores,icon:UserRound,to:"/projeto-oficina/professores",desc:"professores ativos"},
  {title:"Turmas",value:stats.turmas,icon:Layers3,to:"/projeto-oficina/turmas",desc:"turmas ativas"},
  {title:"Aulas realizadas",value:stats.realizadas,icon:CalendarCheck2,to:"/projeto-oficina/aulas",desc:"no mês atual"},
 ];

 return <AuthGuard><div className="min-h-screen bg-[#f7f8fa]"><TopBar/><div className="flex min-h-[calc(100vh-64px)]"><OficinaSidebar/><div className="min-w-0 flex-1"><main className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl">
  <header className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
   <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-black/40">Projeto Oficina</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-[#111827]">Dashboard</h1><p className="mt-2 text-sm text-black/55">Visão geral da operação, financeiro e aulas do mês.</p></div>
   <div className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm"><span className="text-black/45">Competência</span><strong className="ml-2 capitalize">{new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(new Date())}</strong></div>
  </header>

  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
   {cards.map(c=><Link key={c.title} to={c.to} className="group rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-black/20 hover:shadow-md"><div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111827] text-white"><c.icon size={19}/></div><ArrowUpRight size={18} className="text-black/25 transition group-hover:text-black/60"/></div><div className="mt-5 text-3xl font-bold tracking-tight">{loading?"—":c.value}</div><div className="mt-1 text-sm font-medium text-[#111827]">{c.title}</div><div className="mt-1 text-xs text-black/45">{c.desc}</div></Link>)}
  </div>

  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
   <Kpi title="Recebido no mês" value={money(stats.receitas)} icon={<WalletCards size={18}/>} />
   <Kpi title="Em aberto" value={money(stats.aberto)} icon={<AlertCircle size={18}/>} />
   <Kpi title="Horas realizadas" value={`${stats.horas.toLocaleString("pt-BR",{maximumFractionDigits:2})}h`} icon={<Clock3 size={18}/>} />
   <Kpi title="A pagar aos professores" value={money(stats.professor)} icon={<CircleDollarSign size={18}/>} />
  </div>

  <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
   <Panel title="Acompanhamento das aulas" icon={<CalendarCheck2 size={18}/>} action={<Link to="/projeto-oficina/financeiro" className="text-xs font-semibold text-black/55 hover:text-black">Ver financeiro</Link>}>
    <div className="grid gap-3 sm:grid-cols-3">
      <Status label="Realizadas" value={stats.realizadas} icon={<CheckCircle2 size={17}/>} />
      <Status label="Pendentes" value={stats.pendentes} icon={<Clock3 size={17}/>} />
      <Status label="Não realizadas" value={stats.naoRealizadas} icon={<AlertCircle size={17}/>} />
    </div>
    <div className="mt-5 rounded-xl bg-[#f7f8fa] p-4"><div className="flex items-center justify-between text-sm"><span className="text-black/50">Execução do mês</span><strong>{stats.realizadas+stats.pendentes+stats.naoRealizadas>0?Math.round((stats.realizadas/(stats.realizadas+stats.pendentes+stats.naoRealizadas))*100):0}%</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full bg-[#111827]" style={{width:`${stats.realizadas+stats.pendentes+stats.naoRealizadas>0?Math.round((stats.realizadas/(stats.realizadas+stats.pendentes+stats.naoRealizadas))*100):0}%`}}/></div></div>
   </Panel>
   <Panel title="Fechamento do mês" icon={<CircleDollarSign size={18}/>} action={<Link to="/projeto-oficina/fechamentos" className="text-xs font-semibold text-black/55 hover:text-black">Ver fechamentos</Link>}>
    <div className="space-y-3 text-sm"><Metric label="Recebido" value={money(stats.receitas)}/><Metric label="A pagar professores" value={money(stats.professor)}/><Metric label="Saldo" value={money(stats.receitas-stats.professor)} strong/></div>
    <div className="mt-4 rounded-xl border border-black/10 p-3 text-xs text-black/50">O fechamento considera pagamentos do mês e somente aulas marcadas como <strong className="text-black/70">Realizada</strong>.</div>
   </Panel>
  </div>

  <div className="mt-6 rounded-2xl border border-black/10 bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Acesso rápido</h2><p className="mt-1 text-xs text-black/45">Use a barra lateral para navegar por todos os módulos.</p></div><Link to="/projeto-oficina/financeiro" className="rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-medium text-white">Abrir financeiro</Link></div></div>
 </div></main></div></div></div></AuthGuard>
}

function Panel(p:{title:string;icon:React.ReactNode;action?:React.ReactNode;children:React.ReactNode}){return <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-2 font-semibold text-[#111827]">{p.icon}{p.title}</div>{p.action}</div><div className="mt-5">{p.children}</div></section>}
function Kpi(p:{title:string;value:string;icon:React.ReactNode}){return <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-xs font-medium text-black/45">{p.icon}{p.title}</div><div className="mt-3 text-xl font-bold tracking-tight">{p.value}</div></div>}
function Status(p:{label:string;value:number;icon:React.ReactNode}){return <div className="rounded-xl border border-black/10 p-4"><div className="flex items-center gap-2 text-xs text-black/50">{p.icon}{p.label}</div><div className="mt-2 text-2xl font-bold">{p.value}</div></div>}
function Metric(p:{label:string;value:string;strong?:boolean}){return <div className="flex items-center justify-between border-b border-black/10 py-2 last:border-0"><span className="text-black/50">{p.label}</span><strong className={p.strong?"text-base":"text-sm"}>{p.value}</strong></div>}
function money(v:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v)}
function monthStart(){const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1).toISOString().slice(0,10)}
function monthEnd(){const d=new Date();return new Date(d.getFullYear(),d.getMonth()+1,0).toISOString().slice(0,10)}
