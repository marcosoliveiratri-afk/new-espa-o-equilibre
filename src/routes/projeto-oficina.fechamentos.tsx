import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, FileText, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { TopBar } from "@/components/TopBar";
import { supabase } from "@/integrations/supabase/client";

export const Route=createFileRoute("/projeto-oficina/fechamentos")({component:Fechamentos});

type Fechamento={id:string;reference_month:string;status:string;total_receitas:number;total_despesas:number;total_professores:number;closed_at:string|null};

function Fechamentos(){
  const [rows,setRows]=useState<Fechamento[]>([]);
  const [loadingReport,setLoadingReport]=useState(false);

  async function load(){
    const {data}=await supabase.from("oficina_fechamentos").select("*").order("reference_month",{ascending:false});
    setRows((data??[]) as Fechamento[]);
  }

  useEffect(()=>{void load()},[]);

  async function closeMonth(){
    const d=new Date();
    const ref=localDate(new Date(d.getFullYear(),d.getMonth(),1));
    const end=localDate(new Date(d.getFullYear(),d.getMonth()+1,0));
    const [{data:p},{data:e},{data:a}]=await Promise.all([
      supabase.from("oficina_pagamentos").select("amount").eq("status","Pago").gte("due_date",ref).lte("due_date",end),
      supabase.from("oficina_despesas").select("amount").gte("expense_date",ref).lte("expense_date",end),
      supabase.from("oficina_aulas").select("duration_minutes,hourly_rate").eq("status","realizada").gte("aula_date",ref).lte("aula_date",end)
    ]);
    const receita=(p??[]).reduce((s,x)=>s+Number(x.amount),0);
    const desp=(e??[]).reduce((s,x)=>s+Number(x.amount),0);
    const prof=(a??[]).reduce((s,x)=>s+Number(x.duration_minutes)/60*Number(x.hourly_rate),0);
    const {error}=await supabase.from("oficina_fechamentos").upsert({
      reference_month:ref,status:"Fechado",total_receitas:receita,total_despesas:desp,total_professores:prof,closed_at:new Date().toISOString()
    },{onConflict:"reference_month"});
    if(error){window.alert(error.message);return}
    await load();
  }

  async function generateReport(row:Fechamento){
    setLoadingReport(true);
    const popup=window.open("","_blank");
    if(!popup){window.alert("Permita pop-ups para gerar o relatório.");setLoadingReport(false);return}
    popup.document.write("<p style='font-family:Arial;padding:30px'>Gerando relatório...</p>");

    const ref=row.reference_month;
    const end=localDate(new Date(new Date(ref+"T12:00:00").getFullYear(),new Date(ref+"T12:00:00").getMonth()+1,0));
    const [{data:payments},{data:expenses},{data:classes}]=await Promise.all([
      supabase.from("oficina_pagamentos").select("amount,due_date,status,payment_method,destination").eq("status","Pago").gte("due_date",ref).lte("due_date",end).order("due_date"),
      supabase.from("oficina_despesas").select("description,amount,expense_date,category,payment_method").gte("expense_date",ref).lte("expense_date",end).order("expense_date"),
      supabase.from("oficina_aulas").select("aula_date,start_time,duration_minutes,teacher_name,hourly_rate,teacher_amount,turma_name,status").eq("status","realizada").gte("aula_date",ref).lte("aula_date",end).order("aula_date").order("start_time")
    ]);

    const aulas=classes??[];
    const profMap=new Map<string,{hours:number;amount:number;classes:number}>();
    for(const a of aulas){
      const name=a.teacher_name||"Professor não informado";
      const amount=Number(a.teacher_amount??(Number(a.duration_minutes)/60*Number(a.hourly_rate)));
      const current=profMap.get(name)??{hours:0,amount:0,classes:0};
      current.hours+=Number(a.duration_minutes)/60;
      current.amount+=amount;
      current.classes+=1;
      profMap.set(name,current);
    }
    const professorRows=[...profMap.entries()].map(([name,v])=>`<tr><td>${esc(name)}</td><td>${v.classes}</td><td>${v.hours.toFixed(2).replace(".",",")} h</td><td>${money(v.amount)}</td></tr>`).join("");
    const classRows=aulas.map(a=>`<tr><td>${dateBR(a.aula_date)}</td><td>${esc(a.turma_name||"—")}</td><td>${esc(a.teacher_name||"—")}</td><td>${String(a.start_time||"").slice(0,5)}</td><td>${Number(a.duration_minutes)} min</td><td>${money(Number(a.teacher_amount??(Number(a.duration_minutes)/60*Number(a.hourly_rate))))}</td></tr>`).join("");
    const paymentRows=(payments??[]).map(p=>`<tr><td>${dateBR(p.due_date)}</td><td>${esc(p.payment_method||"—")}</td><td>${esc(p.destination||"—")}</td><td>${money(Number(p.amount))}</td></tr>`).join("");
    const expenseRows=(expenses??[]).map(e=>`<tr><td>${dateBR(e.expense_date)}</td><td>${esc(e.description||"—")}</td><td>${esc(e.category||"—")}</td><td>${esc(e.payment_method||"—")}</td><td>${money(Number(e.amount))}</td></tr>`).join("");
    const saldo=Number(row.total_receitas)-Number(row.total_despesas)-Number(row.total_professores);

    popup.document.open();
    popup.document.write(`<!doctype html><html><head><title>Relatório - Fechamento ${monthBR(ref)}</title><style>
      body{font-family:Arial,sans-serif;color:#111827;margin:0;padding:32px;background:#fff;font-size:12px}
      .wrap{max-width:1050px;margin:auto}.head{display:flex;justify-content:space-between;border-bottom:2px solid #111827;padding-bottom:16px;margin-bottom:22px}
      h1{font-size:24px;margin:0 0 5px}.muted{color:#6b7280}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px}
      .card{border:1px solid #e5e7eb;border-radius:10px;padding:12px}.label{font-size:10px;text-transform:uppercase;color:#6b7280}.value{font-size:17px;font-weight:700;margin-top:5px}
      h2{font-size:15px;margin:24px 0 9px}.section{page-break-inside:avoid}table{width:100%;border-collapse:collapse;margin-bottom:18px}
      th,td{border-bottom:1px solid #e5e7eb;padding:7px 6px;text-align:left}th{font-size:10px;text-transform:uppercase;color:#6b7280;background:#f9fafb}
      .right{text-align:right}.footer{margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:10px}
      @media print{body{padding:16px}.no-print{display:none}.cards{grid-template-columns:repeat(4,1fr)}}
    </style></head><body><div class="wrap">
      <div class="head"><div><div class="muted">Projeto Oficina</div><h1>Relatório de Fechamento</h1><div class="muted">Competência: <strong>${monthBR(ref)}</strong></div></div><div class="muted">Status: <strong>${esc(row.status)}</strong></div></div>
      <div class="cards">
        <div class="card"><div class="label">Receitas recebidas</div><div class="value">${money(Number(row.total_receitas))}</div></div>
        <div class="card"><div class="label">Despesas</div><div class="value">${money(Number(row.total_despesas))}</div></div>
        <div class="card"><div class="label">Professores</div><div class="value">${money(Number(row.total_professores))}</div></div>
        <div class="card"><div class="label">Saldo líquido</div><div class="value">${money(saldo)}</div></div>
      </div>
      <div class="section"><h2>Resumo por professor</h2><table><thead><tr><th>Professor</th><th>Aulas realizadas</th><th>Horas</th><th>Valor a receber</th></tr></thead><tbody>${professorRows||"<tr><td colspan='4'>Nenhuma aula realizada no período.</td></tr>"}</tbody></table></div>
      <div class="section"><h2>Aulas realizadas</h2><table><thead><tr><th>Data</th><th>Turma</th><th>Professor</th><th>Horário</th><th>Duração</th><th>Pagamento</th></tr></thead><tbody>${classRows||"<tr><td colspan='6'>Nenhuma aula realizada no período.</td></tr>"}</tbody></table></div>
      <div class="section"><h2>Receitas recebidas</h2><table><thead><tr><th>Data</th><th>Forma</th><th>Destino</th><th>Valor</th></tr></thead><tbody>${paymentRows||"<tr><td colspan='4'>Nenhuma receita recebida no período.</td></tr>"}</tbody></table></div>
      <div class="section"><h2>Despesas</h2><table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Forma</th><th>Valor</th></tr></thead><tbody>${expenseRows||"<tr><td colspan='5'>Nenhuma despesa no período.</td></tr>"}</tbody></table></div>
      <div class="footer">Relatório gerado pelo Projeto Oficina em ${new Date().toLocaleString("pt-BR")}.</div>
      <div class="no-print" style="margin-top:20px"><button onclick="window.print()" style="padding:10px 16px;border:0;border-radius:8px;background:#111827;color:#fff;cursor:pointer">Imprimir / Salvar em PDF</button></div>
    </div></body></html>`);
    popup.document.close();
    setLoadingReport(false);
  }

  return <AuthGuard><div className="min-h-screen bg-white"><TopBar/><main className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-6xl">
    <header className="mb-6 flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-black/40">Projeto Oficina</p><h1 className="mt-1 text-[30px] font-bold text-[#111827]">Fechamentos</h1><p className="mt-2 text-sm text-black/50">Fechamento mensal com histórico dos valores calculados e relatório detalhado.</p></div><button onClick={closeMonth} className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-sm text-white"><LockKeyhole size={16}/> Fechar mês atual</button></header>
    <section className="rounded-2xl border border-black/10 overflow-hidden"><table className="w-full text-sm"><thead className="bg-[#fafafa] text-xs text-black/45"><tr><th className="p-4 text-left">Competência</th><th className="p-4 text-left">Receitas</th><th className="p-4 text-left">Despesas</th><th className="p-4 text-left">Professores</th><th className="p-4 text-left">Saldo</th><th className="p-4 text-left">Status</th><th className="p-4 text-right">Relatório</th></tr></thead><tbody>{rows.map(x=><tr key={x.id} className="border-t"><td className="p-4">{monthBR(x.reference_month)}</td><td className="p-4">{money(Number(x.total_receitas))}</td><td className="p-4">{money(Number(x.total_despesas))}</td><td className="p-4">{money(Number(x.total_professores))}</td><td className="p-4 font-semibold">{money(Number(x.total_receitas)-Number(x.total_despesas)-Number(x.total_professores))}</td><td className="p-4"><span className="inline-flex items-center gap-1.5 text-emerald-700"><CheckCircle2 size={15}/>{x.status}</span></td><td className="p-4 text-right"><button disabled={loadingReport} onClick={()=>void generateReport(x)} className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium hover:bg-black/[.03] disabled:opacity-50"><FileText size={15}/>{loadingReport?"Gerando...":"Gerar relatório"}</button></td></tr>)}</tbody></table>{!rows.length&&<div className="p-10 text-center text-sm text-black/45">Nenhum fechamento realizado.</div>}</section>
  </div></main></div></AuthGuard>
}

function localDate(d:Date){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function dateBR(value:string){return new Date(value+"T12:00:00").toLocaleDateString("pt-BR")}
function monthBR(value:string){return new Date(value+"T12:00:00").toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}
function esc(value:string){return value.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]??c))}
function money(v:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v)}
