import { Link, createFileRoute } from "@tanstack/react-router";
import { CircleDollarSign, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { TopBar } from "@/components/TopBar";
import { OficinaSidebar } from "@/components/OficinaSidebar";
import { supabase } from "@/integrations/supabase/client";

export const Route=createFileRoute("/projeto-oficina/")({component:ProjetoOficina});
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
 return <AuthGuard><div className="min-h-screen bg-white"><TopBar/><div className="flex min-h-[calc(100vh-64px)]"><OficinaSidebar/><div className="min-w-0 flex-1"><main className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl">
  <header className="mb-8"><p className="text-xs font-semibold uppercase tracking-[.12em] text-black/40">Projeto Oficina</p><h1 className="mt-1 text-[30px] font-bold leading-[1.2] tracking-[-0.02em] text-[#111827]">Dashboard</h1><p className="mt-2 text-sm text-black/55">Gestão independente de alunos, turmas, pagamentos e fechamento.</p></header>
  <div className="grid gap-4 lg:grid-cols-2"><Panel title="Financeiro do mês" icon={<WalletCards size={18}/>}><Metric label="Recebido" value={money(stats.receitas)}/><Metric label="A pagar aos professores" value={money(stats.professor)}/><Link to="/projeto-oficina/financeiro" className="mt-4 inline-flex rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-medium text-white">Abrir financeiro</Link></Panel><Panel title="Fechamento" icon={<CircleDollarSign size={18}/>}><p className="text-sm text-black/55">O fechamento considera pagamentos recebidos e somente aulas marcadas como Realizada.</p><Link to="/projeto-oficina/fechamentos" className="mt-4 inline-flex rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium">Abrir fechamentos</Link></Panel></div>
 </div></main></div></div></div></AuthGuard>
}
function Panel(p:{title:string;icon:React.ReactNode;children:React.ReactNode}){return <section className="rounded-2xl border border-black/10 p-5"><div className="flex items-center gap-2 font-semibold">{p.icon}{p.title}</div><div className="mt-5">{p.children}</div></section>}
function Metric(p:{label:string;value:string}){return <div className="flex items-center justify-between border-b border-black/10 py-2 text-sm"><span className="text-black/50">{p.label}</span><strong>{p.value}</strong></div>}
function money(v:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v)}
function monthStart(){const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1).toISOString().slice(0,10)}
function monthEnd(){const d=new Date();return new Date(d.getFullYear(),d.getMonth()+1,0).toISOString().slice(0,10)}