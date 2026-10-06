import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, FileText, LockKeyhole, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { TopBar } from "@/components/TopBar";
import { OficinaSidebar } from "@/components/OficinaSidebar";
import { supabase } from "@/integrations/supabase/client";

export const Route=createFileRoute("/projeto-oficina/fechamentos")({component:Fechamentos});

type Fechamento={id:string;reference_month:string;status:string;total_receitas:number;total_despesas:number;total_professores:number;closed_at:string|null};
type Relatorio={id:string;fechamento_id:string;reference_month:string;title:string;content_html:string};

function Fechamentos(){
  const [rows,setRows]=useState<Fechamento[]>([]);
  const [loadingReport,setLoadingReport]=useState(false);
  const [deleting,setDeleting]=useState<string | null>(null);
  const [reports,setReports]=useState<Record<string,Relatorio>>({});
  const [selectedMonth,setSelectedMonth]=useState(()=>localDate(new Date(new Date().getFullYear(),new Date().getMonth(),1)).slice(0,7));

  async function load(){
    const {data}=await supabase.from("oficina_fechamentos").select("*").order("reference_month",{ascending:false});
    const {data:reportData}=await supabase.from("oficina_relatorios").select("*");
    setRows((data??[]) as Fechamento[]);
    setReports(Object.fromEntries(((reportData??[]) as Relatorio[]).map(report=>[report.fechamento_id,report])));
  }
  useEffect(()=>{void load()},[]);

  async function closeMonth(){
    const [year=0,month=1]=selectedMonth.split("-").map(Number);
    const ref=localDate(new Date(year,month-1,1)),end=localDate(new Date(year,month,0));
    const [{data:p},{data:a}]=await Promise.all([
      supabase.from("oficina_pagamentos").select("amount").eq("status","Pago").gte("due_date",ref).lte("due_date",end),
      supabase.from("oficina_aulas").select("duration_minutes,hourly_rate").eq("status","realizada").gte("aula_date",ref).lte("aula_date",end)
    ]);
    const receita=(p??[]).reduce((s,x)=>s+Number(x.amount),0),prof=(a??[]).reduce((s,x)=>s+Number(x.duration_minutes)/60*Number(x.hourly_rate),0);
    const {error}=await supabase.from("oficina_fechamentos").upsert({reference_month:ref,status:"Fechado",total_receitas:receita,total_professores:prof,closed_at:new Date().toISOString()},{onConflict:"reference_month"});
    if(error){window.alert(error.message);return}
    await load();
  }

  async function deleteClosing(row:Fechamento){
    if(!window.confirm(`Excluir o fechamento de ${monthBR(row.reference_month)}? O relatório gerado também será excluído. Os lançamentos financeiros e aulas do período não serão alterados.`)) return;
    setDeleting(row.id);
    try{
      const report=reports[row.id];
      if(report){
        const {error:reportError}=await supabase.from("oficina_relatorios").delete().eq("id",report.id);
        if(reportError){window.alert("Não foi possível excluir o relatório do fechamento: "+reportError.message);return}
      }
      const {error}=await supabase.from("oficina_fechamentos").delete().eq("id",row.id);
      if(error){window.alert("Não foi possível excluir o fechamento: "+error.message);return}
      await load();
    }finally{
      setDeleting(null);
    }
  }

  async function generateReport(row:Fechamento){
    setLoadingReport(true);
    const popup=window.open("","_blank");
    if(!popup){window.alert("Permita pop-ups para gerar o relatório.");setLoadingReport(false);return}
    popup.document.write("<p style='font-family:Arial;padding:30px'>Gerando relatório...</p>");

    const ref=row.reference_month;
    const refDate=new Date(ref+"T12:00:00");
    const end=localDate(new Date(refDate.getFullYear(),refDate.getMonth()+1,0));
    const [{data:payments},{data:classes}]=await Promise.all([
      supabase.from("oficina_pagamentos").select("amount,due_date,paid_at,status,payment_method,destination").eq("status","Pago").gte("due_date",ref).lte("due_date",end).order("due_date"),
      supabase.from("oficina_aulas").select("aula_date,start_time,duration_minutes,teacher_name,hourly_rate,teacher_amount,turma_name,status").eq("status","realizada").gte("aula_date",ref).lte("aula_date",end).order("aula_date").order("start_time")
    ]);

    const aulas=classes??[];
    const professorMap=new Map<string,{hours:number;amount:number;classes:number}>();
    for(const a of aulas){
      const name=a.teacher_name||"Professor não informado";
      const amount=Number(a.teacher_amount??(Number(a.duration_minutes)/60*Number(a.hourly_rate)));
      const current=professorMap.get(name)??{hours:0,amount:0,classes:0};
      current.hours+=Number(a.duration_minutes)/60; current.amount+=amount; current.classes+=1; professorMap.set(name,current);
    }

    const classRows=aulas.map(a=>`<tr><td>${dateBR(a.aula_date)}</td><td>${esc(a.turma_name||"—")}</td><td>${esc(a.teacher_name||"—")}</td><td class="value">${money(Number(a.teacher_amount??(Number(a.duration_minutes)/60*Number(a.hourly_rate))))}</td></tr>`).join("");
    const professorRows=[...professorMap.entries()].map(([name,v])=>`<tr><td>${esc(name)}</td><td>${v.classes}</td><td>${v.hours.toFixed(2).replace(".",",")} h</td><td class="value">${money(v.amount)}</td></tr>`).join("");
    const paymentRows=(payments??[]).map(p=>`<tr><td>${dateBR(p.paid_at||p.due_date)}</td><td>${esc(p.payment_method||"—")}</td><td>${esc(p.destination||"—")}</td><td class="value">${money(Number(p.amount))}</td></tr>`).join("");
    const totalHours=aulas.reduce((s,a)=>s+Number(a.duration_minutes)/60,0);
    const saldo=Number(row.total_receitas)-Number(row.total_professores);
    const periodEnd=new Date(refDate.getFullYear(),refDate.getMonth()+1,0);
    const logo="/__l5e/assets-v1/6c7fcdfc-705e-4b26-9799-c2d14e1fe6ae/logo-equilibre.png";

    const pages:string[]=[];
    const pageSize=25;
    const totalClassPages=Math.max(1,Math.ceil(aulas.length/pageSize));
    for(let pageIndex=0;pageIndex<totalClassPages;pageIndex++){
      const start=pageIndex*pageSize;
      const chunk=aulas.slice(start,start+pageSize).map(a=>`<tr><td>${dateBR(a.aula_date)}</td><td>${esc(a.turma_name||"—")}</td><td>${esc(a.teacher_name||"—")}</td><td class="value">${money(Number(a.teacher_amount??(Number(a.duration_minutes)/60*Number(a.hourly_rate))))}</td></tr>`).join("");
      const isFirst=pageIndex===0;
      const isLast=pageIndex===totalClassPages-1;
      const summary=isLast?`<div class="summary"><div class="summary-title">Resumo do período</div><div class="summary-row"><span>Total de aulas realizadas</span><strong>${aulas.length}</strong></div><div class="summary-row"><span>Total de horas realizadas</span><strong>${totalHours.toFixed(2).replace(".",",")} h</strong></div><div class="summary-row"><span>Total de receitas recebidas</span><strong>${money(Number(row.total_receitas))}</strong></div><div class="summary-row"><span>Total a pagar aos professores</span><strong>${money(Number(row.total_professores))}</strong></div><div class="summary-row total"><span>Saldo final do fechamento</span><strong>${money(saldo)}</strong></div></div><div class="prof-summary"><div class="summary-title">Resumo por professor</div><table><thead><tr><th>Professor</th><th>Aulas</th><th>Horas</th><th>Valor</th></tr></thead><tbody>${professorRows||"<tr><td colspan='4'>Nenhum professor com aulas realizadas.</td></tr>"}</tbody></table></div>${paymentRows?`<div class="mini-section"><div class="mini-title">Receitas recebidas</div><table><thead><tr><th>Data</th><th>Forma</th><th>Destino</th><th>Valor</th></tr></thead><tbody>${paymentRows}</tbody></table></div>`:''}<div class="last-footer">Relatório gerado pelo Projeto Oficina</div>`:'';
      pages.push(`<section class="page${isLast?' summary-page':''}"><header class="running"><span>${new Date().toLocaleDateString("pt-BR")}</span><span>Gerador de Relatório de Fechamentos</span></header>${isFirst?`<div class="brand"><img src="${logo}" onerror="this.style.display='none'"/></div><h1>RELATÓRIO DE FECHAMENTO - OFICINA</h1><div class="subtitle">Competência: ${monthBR(ref)} | Período: ${dateBR(ref)} a ${dateBR(localDate(periodEnd))}</div>`:''}<table class="main-table"><thead><tr><th>Data</th><th>Turma</th><th>Professor</th><th>Valor</th></tr></thead><tbody>${chunk||"<tr><td colspan='4'>Nenhuma aula realizada no período.</td></tr>"}</tbody></table>${summary}<footer>${pageIndex+1}/${totalClassPages}</footer></section>`);
    }

    const reportHtml=`<!doctype html><html><head><title>Relatório de Fechamento - ${monthBR(ref)}</title><style>
      @page{size:A4 portrait;margin:0}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;margin:0;background:white;font-size:12px}
      .page{width:210mm;min-height:297mm;padding:14mm 14mm 13mm;position:relative;page-break-after:always}.page:last-child{page-break-after:auto}
      .running{display:flex;justify-content:space-between;font-size:9px;color:#222;margin-bottom:10mm}.brand{text-align:center;height:25mm}.brand img{width:28mm;height:28mm;object-fit:contain;margin-top:-3mm}
      h1{text-align:center;color:#985c52;font-size:20px;margin:0 0 4px;font-weight:700}.subtitle{text-align:center;color:#666;font-size:11px;margin-bottom:5mm}
      table{width:100%;border-collapse:collapse}.main-table{border:1px solid #dfbdb5}.main-table th{background:#c98375;color:#fff;font-weight:700;padding:7px 9px;border:1px solid #c98375}.main-table td{padding:6px 9px;border:1px solid #e4c6c0;height:7mm}.main-table tbody tr:nth-child(even) td{background:#f7e9e6}.main-table th:first-child,.main-table td:first-child{width:13%;text-align:center}.main-table th:last-child,.main-table td:last-child{width:22%;text-align:right}.value{text-align:right}
      footer{position:absolute;bottom:8mm;right:14mm;font-size:9px;color:#222}.summary-page{padding-top:14mm}.summary{width:75%;margin-top:6mm}.summary-title,.mini-title{background:#c98375;color:#fff;font-weight:700;padding:7px 9px;font-size:12px}.summary-row{display:flex;justify-content:space-between;padding:7px 9px;border:1px solid #e4c6c0;border-top:0;background:#fff}.summary-row:nth-child(odd){background:#f7e9e6}.summary-row.total{font-weight:700}.prof-summary{width:75%;margin-top:8mm}.prof-summary table{border:1px solid #dfbdb5}.prof-summary th{background:#c98375;color:#fff;padding:6px 8px;text-align:left}.prof-summary td{padding:6px 8px;border:1px solid #e4c6c0}.prof-summary tr:nth-child(even) td{background:#f7e9e6}.mini-section{width:100%;margin-top:7mm}.mini-section table{border:1px solid #dfbdb5}.mini-section th{background:#c98375;color:#fff;padding:5px 7px;text-align:left}.mini-section td{padding:5px 7px;border:1px solid #e4c6c0}.mini-section tr:nth-child(even) td{background:#f7e9e6}.last-footer{position:static;margin-top:10mm;border-top:0;text-align:left;font-size:9px;color:#777}
      @media print{.page{break-after:page}.page:last-child{break-after:auto}.no-print{display:none}}
    </style></head><body>${pages.join("")}<div class="no-print" style="position:fixed;top:12px;right:12px"><button onclick="window.print()" style="padding:10px 16px;border:0;border-radius:7px;background:#c98375;color:#fff;cursor:pointer">Imprimir / Salvar em PDF</button></div></body></html>`;
    const {error:reportError}=await supabase.from("oficina_relatorios").upsert({fechamento_id:row.id,reference_month:ref,title:`Relatório de Fechamento - ${monthBR(ref)}`,content_html:reportHtml,updated_at:new Date().toISOString()},{onConflict:"fechamento_id"});
    if(reportError){popup.close();setLoadingReport(false);window.alert("Não foi possível salvar o relatório: "+reportError.message);return}
    popup.document.open();
    popup.document.write(reportHtml);
    popup.document.close();
    setLoadingReport(false);
  }

  return <AuthGuard><div className="min-h-screen bg-white"><TopBar/><div className="flex min-h-[calc(100vh-64px)]"><OficinaSidebar/><div className="min-w-0 flex-1"><main className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-6xl">
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-black/40">Projeto Oficina</p><h1 className="mt-1 text-[30px] font-bold text-[#111827]">Fechamentos</h1><p className="mt-2 text-sm text-black/50">Fechamento mensal com relatório no padrão visual do Espaço Equilibre.</p></div><div className="flex flex-wrap items-end gap-2"><label className="block"><span className="mb-1 block text-xs font-medium text-black/50">Competência do fechamento</span><input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm text-[#111827] outline-none focus:border-black/30"/></label><button onClick={closeMonth} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#111827] px-4 text-sm text-white"><LockKeyhole size={16}/> Fechar competência</button></div></header>
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-white"><div className="overflow-x-auto"><table className="min-w-[1180px] w-full table-fixed text-sm"><thead className="bg-[#fafafa] text-xs text-black/45"><tr><th className="w-[15%] p-4 text-left whitespace-nowrap">Competência</th><th className="w-[13%] p-4 text-left whitespace-nowrap">Receitas</th><th className="w-[13%] p-4 text-left whitespace-nowrap">Despesas</th><th className="w-[13%] p-4 text-left whitespace-nowrap">Professores</th><th className="w-[13%] p-4 text-left whitespace-nowrap">Saldo</th><th className="w-[12%] p-4 text-left whitespace-nowrap">Status</th><th className="w-[29%] p-4 text-right whitespace-nowrap">Ações</th></tr></thead><tbody>{rows.map(x=><tr key={x.id} className="border-t"><td className="p-4">{monthBR(x.reference_month)}</td><td className="p-4">{money(Number(x.total_receitas))}</td><td className="p-4">{money(Number(x.total_despesas))}</td><td className="p-4">{money(Number(x.total_professores))}</td><td className="p-4 font-semibold">{money(Number(x.total_receitas)-Number(x.total_despesas)-Number(x.total_professores))}</td><td className="p-4 align-middle"><span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700"><CheckCircle2 size={15}/>{x.status}</span></td><td className="p-4 align-middle"><div className="flex items-center justify-end gap-3 whitespace-nowrap"><button disabled={loadingReport} onClick={()=>void generateReport(x)} className="inline-flex h-9 min-w-[140px] items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-xs font-semibold text-[#111827] shadow-sm transition hover:bg-black/[.03] disabled:cursor-not-allowed disabled:opacity-50"><FileText size={15}/>{loadingReport?"Gerando...":"Gerar relatório"}</button><button disabled={deleting===x.id} onClick={()=>void deleteClosing(x)} className="inline-flex h-9 min-w-[132px] items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={15}/>{deleting===x.id?"Excluindo...":"Excluir fechamento"}</button></div></td></tr>)}</tbody></table></div>{!rows.length&&<div className="p-10 text-center text-sm text-black/45">Nenhum fechamento realizado.</div>}</section>
  </div></main></div></div></div></AuthGuard>
}

function localDate(d:Date){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function dateBR(value:string){return new Date(value+"T12:00:00").toLocaleDateString("pt-BR")}
function monthBR(value:string){return new Date(value+"T12:00:00").toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}
function esc(value:string){return value.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]??c))}
function money(v:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v)}
