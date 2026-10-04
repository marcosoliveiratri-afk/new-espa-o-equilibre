import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarCheck2, CircleDollarSign, ClipboardList, UsersRound, UserRoundCog, WalletCards } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { TopBar } from "@/components/TopBar";
import { OficinaSidebar } from "@/components/OficinaSidebar";
import { supabase } from "@/integrations/supabase/client";

export const Route=createFileRoute("/projeto-oficina")({component:ProjetoOficina});
function ProjetoOficina(){
 const [stats,setStats]=useState({alunos:0,professores:0,turmas:0,realizadas:0,receitas:0,professor:0});
 async function load(){
  const [a,p,t,au,pag]=await Promise.all([
   supabase.from("oficina_alunos").select("id",{count:"exact",head:true}).eq("active",true),
   supabase.from("oficina_professores").select("id",{count:"exact",head:true}).eq("active",true),
   supabase.from("oficina_turmas").select("id",{count:"exact",head:true}).eq("active",true),
   supabase.from("oficina_aulas").select("id,duration_minutes,hourly_rate,status").eq("status","realizada").gte("aula_date",monthStart()).lte("aula_date",monthEnd()),
   supabase.from("oficina_pagamentos").select("amount,status").eq("status","Pago").gte("due_date",monthStart()).lte("due_date",monthEnd())
  ]);
  const aulas=(au.data??[]) as any[], payments=(pag.data??[]) as any[];
  setStats({alunos:a.count??0,professores:p.count??0,turmas:t.count??0,realizadas:aulas.length,receitas:payments.reduce((s,x)=>s+Number(x.amount),0),professor:aulas.reduce((s,x)=>s+Number(x.duration_minutes)/60*Number(x.hourly_rate),0)});
 }
 useEffect(()=>{void load()},[]);
 const cards:{label:string;value:number;Icon:LucideIcon;to:"/projeto-oficina/alunos"|"/projeto-oficina/professores"|"/projeto-oficina/aulas"}[]=[
  {label:"Alunos",value:stats.alunos,Icon:UsersRound,to:"/projeto-oficina/alunos"},
  {label:"Professores",value:stats.professores,Icon:UserRoundCog,to:"/projeto-oficina/professores"},
  {label:"Turmas",value:stats.turmas,Icon:ClipboardList,to:"/projeto-oficina/aulas"},
  {label:"Aulas realizadas",value:stats.realizadas,Icon:CalendarCheck2,to:"/projeto-oficina/aulas"},
 ];
 return <AuthGuard><div className="min-h-screen bg-white"><TopBar/><div className="flex min-h-[calc(100vh-64px)]"><OficinaSidebar/><div className="min-w-0 flex-1"><main className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl">
  <header className="mb-8"><p className="text-xs font-semibold uppercase tracking-[.12em] text-black/40">Projeto Oficina</p><h1 className="mt-1 text-[30px] font-bold leading-[1.2] tracking-[-0.02em] text-[#111827]">Dashboard</h1><p className="mt-2 text-sm text-black/55">Gestão independente de alunos, turmas, pagamentos e fechamento.</p></header>
  <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({label,value,Icon,to})=><Link key={label} to={to} className="rounded-2xl border border-black/10 p-5 hover:bg-black/[.02]"><div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-black/5"><Icon size={18}/></div><p className="mt-4 text-[13px] text-black/50">{label}</p><p className="mt-1 text-2xl font-bold text-[#111827]">{value}</p></Link>)}</div>
  <div className="grid gap-4 lg:grid-cols-2"><Panel title="Financeiro do mês" icon={<WalletCards size={18}/>}><Metric label="Recebido" value={money(stats.receitas)}/><Metric label="A pagar aos professores" value={money(stats.professor)}/><Link to="/projeto-oficina/financeiro" className="mt-4 inline-flex rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-medium text-white">Abrir financeiro</Link></Panel><Panel title="Fechamento" icon={<CircleDollarSign size={18}/>}><p className="text-sm text-black/55">O fechamento considera pagamentos recebidos, despesas cadastradas e somente aulas marcadas como Realizada.</p><Link to="/projeto-oficina/fechamentos" className="mt-4 inline-flex rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium">Abrir fechamentos</Link></Panel></div>
  <nav className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Nav to="/projeto-oficina/alunos" text="Alunos"/><Nav to="/projeto-oficina/alertas" text="Alertas"/><Nav to="/projeto-oficina/professores" text="Professores"/><Nav to="/projeto-oficina/aulas" text="Aulas e turmas"/><Nav to="/projeto-oficina/financeiro" text="Financeiro"/><Nav to="/projeto-oficina/planos" text="Planos"/></nav>
 </div></main></div></div></div></AuthGuard>
}
function Panel(p:{title:string;icon:React.ReactNode;children:React.ReactNode}){return <section className="rounded-2xl border border-black/10 p-5"><div className="flex items-center gap-2 font-semibold">{p.icon}{p.title}</div><div className="mt-5">{p.children}</div></section>}
function Metric(p:{label:string;value:string}){return <div className="flex items-center justify-between border-b border-black/10 py-2 text-sm"><span className="text-black/50">{p.label}</span><strong>{p.value}</strong></div>}
function Nav(p:{to:any;text:string}){return <Link to={p.to} className="rounded-xl border border-black/10 p-4 text-sm font-medium hover:bg-black/5">{p.text}</Link>}
function money(v:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v)}
function monthStart(){const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1).toISOString().slice(0,10)}
function monthEnd(){const d=new Date();return new Date(d.getFullYear(),d.getMonth()+1,0).toISOString().slice(0,10)}