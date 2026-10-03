import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, ArrowDownRight, ArrowUpRight, CheckCircle2, CircleDollarSign, FileCheck2, RefreshCw, WalletCards } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { AuthGuard } from "@/components/AuthGuard";

export const Route = createFileRoute("/osteopatia")({ component: Osteopatia });

const SHEET_ID = "17h3G-GNIUNJMBN5UlIYQNgRR_OUHVDb4";
const SOURCES = [
  ["202610", "Outubro/2026"], ["202609", "Setembro/2026"], ["202611", "Novembro/2026"], ["202612", "Dezembro/2026"],
] as const;

type Row = { id:string; date:Date|null; plan:string; payment:string; method:string; paymentDate:Date|null; invoice:string; invoiceNumber:string; value:number|null };

function parseDate(v:unknown):Date|null {
  if(typeof v!=="string") return null;
  const m=v.match(/Date\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+),\s*(\d+),\s*(\d+))?/);
  if(m) return new Date(+m[1],+m[2],+m[3],+(m[4]||0),+(m[5]||0),+(m[6]||0));
  const d=new Date(v); return Number.isNaN(d.getTime())?null:d;
}
function num(v:unknown):number|null {
  if(typeof v==="number"&&Number.isFinite(v)) return v;
  if(typeof v!=="string") return null;
  const n=Number(v.replace(/R\$\s?/gi,"").replace(/\./g,"").replace(",",".").trim());
  return Number.isFinite(n)?n:null;
}
function money(v:number){return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});}
function date(v:Date|null){return v?v.toLocaleDateString("pt-BR"):"—";}

async function readTab(tab:string):Promise<Row[]> {
  const res=await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tab)}`,{cache:"no-store"});
  if(!res.ok) throw new Error(`Não foi possível ler a aba ${tab}.`);
  const text=await res.text(),a=text.indexOf("{"),b=text.lastIndexOf("}");
  if(a<0||b<a) throw new Error("O Google Sheets não retornou dados legíveis.");
  const data=JSON.parse(text.slice(a,b+1)) as {table?:{rows?:Array<{c?:Array<{v?:unknown}|null>}>}};
  return (data.table?.rows??[]).map((r,i)=>{
    const c=(n:number)=>r.c?.[n]?.v??"";
    return {id:`${tab}-${i}`,date:parseDate(c(2)),plan:String(c(4)||"").trim(),payment:String(c(5)||"").trim().toUpperCase(),method:String(c(6)||"").trim(),paymentDate:parseDate(c(7)),invoice:String(c(8)||"").trim().toUpperCase(),invoiceNumber:String(c(10)||"").trim(),value:num(c(9))};
  }).filter(r=>r.plan||r.payment||r.value!==null||r.date);
}

function Kpi({label,value,detail,icon:Icon,positive=false}:{label:string;value:string;detail:string;icon:typeof WalletCards;positive?:boolean}){
  return <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,.035)]">
    <div className="flex items-start justify-between gap-4"><div><p className="text-[13px] font-medium text-black/45">{label}</p><p className="mt-2 text-[27px] font-semibold tracking-[-0.03em]">{value}</p><p className={`mt-1 flex items-center gap-1 text-xs ${positive?"text-emerald-600":"text-black/40"}`}>{positive&&<ArrowUpRight size={13}/>} {detail}</p></div><div className="rounded-xl bg-black/[0.035] p-2.5"><Icon size={19} className="text-black/55"/></div></div>
  </div>;
}

function Osteopatia(){
  const [source,setSource]=useState("202610"),[rows,setRows]=useState<Row[]>([]),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[error,setError]=useState("");
  const [payment,setPayment]=useState("TODOS"),[plan,setPlan]=useState("TODOS"),[invoice,setInvoice]=useState("TODOS"),[from,setFrom]=useState(""),[to,setTo]=useState("");

  const load=useCallback(async(manual=false)=>{
    try{manual?setRefreshing(true):setLoading(true);setError("");setRows(await readTab(source));}
    catch(e){setError(e instanceof Error?e.message:"Erro ao carregar a planilha.");}
    finally{setLoading(false);setRefreshing(false);}
  },[source]);
  useEffect(()=>{void load();const t=window.setInterval(()=>void load(true),60000);return()=>window.clearInterval(t)},[load]);

  const plans=useMemo(()=>Array.from(new Set(rows.map(r=>r.plan).filter(Boolean))).sort(),[rows]);
  const payments=useMemo(()=>Array.from(new Set(rows.map(r=>r.payment).filter(Boolean))).sort(),[rows]);
  const filtered=useMemo(()=>rows.filter(r=>{
    if(payment!=="TODOS"&&r.payment!==payment)return false;if(plan!=="TODOS"&&r.plan!==plan)return false;if(invoice!=="TODOS"&&r.invoice!==invoice)return false;
    if(from&&r.date&&r.date<new Date(from+"T00:00:00"))return false;if(to&&r.date&&r.date>new Date(to+"T23:59:59"))return false;return true;
  }),[rows,payment,plan,invoice,from,to]);

  const m=useMemo(()=>{
    const paid=filtered.filter(r=>r.payment==="PAGO"), not=filtered.filter(r=>r.payment==="NÃO REALIZADO"), nfs=filtered.filter(r=>r.invoice==="SIM");
    const methods=new Map<string,{count:number;value:number}>(), plansMap=new Map<string,{count:number;value:number}>();
    paid.forEach(r=>{const k=r.method||"Não informado",x=methods.get(k)||{count:0,value:0};x.count++;x.value+=r.value??0;methods.set(k,x)});
    filtered.forEach(r=>{const k=r.plan||"Não informado",x=plansMap.get(k)||{count:0,value:0};x.count++;x.value+=r.value??0;plansMap.set(k,x)});
    const total=filtered.reduce((s,r)=>s+(r.value??0),0);
    return {attended:filtered.filter(r=>r.payment!=="NÃO REALIZADO").length,not:not.length,paid:paid.length,paidValue:paid.reduce((s,r)=>s+(r.value??0),0),total,nf:nfs.length,nfValue:nfs.reduce((s,r)=>s+(r.value??0),0),methods:[...methods.entries()].sort((a,b)=>b[1].value-a[1].value),plans:[...plansMap.entries()].sort((a,b)=>b[1].value-a[1].value)};
  },[filtered]);

  const clear=()=>{setPayment("TODOS");setPlan("TODOS");setInvoice("TODOS");setFrom("");setTo("")};

  return <AuthGuard><div className="min-h-screen bg-[#f7f7f6]"><TopBar/><AppShell><main className="mx-auto max-w-[1440px] pb-12">
    <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-black/35">Gestão financeira e operacional</p><h1 className="mt-2 text-[34px] font-semibold tracking-[-.035em]">Osteopatia</h1><p className="mt-1.5 text-sm text-black/50">Visão consolidada da agenda, pagamentos e notas fiscais.</p></div>
      <div className="flex items-center gap-2"><span className="hidden text-xs text-black/35 sm:inline">Atualização automática a cada 60s</span><button onClick={()=>void load(true)} disabled={refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-medium shadow-sm transition hover:bg-black/[.02] disabled:opacity-50"><RefreshCw size={15} className={refreshing?"animate-spin":""}/>Atualizar</button></div>
    </header>

    {error&&<div className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={18}/><div><b>Não foi possível atualizar os dados.</b><p className="mt-1">{error}</p><p className="mt-2 text-xs">Verifique se a planilha está compartilhada como “Qualquer pessoa com o link — Leitor”.</p></div></div>}

    <section className="mb-6 rounded-2xl border border-black/[.08] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,.035)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="min-w-[220px] flex-1 text-[11px] font-semibold uppercase tracking-wide text-black/40">Competência<select value={source} onChange={e=>setSource(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-black/25">{SOURCES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-black/40">Pagamento<select value={payment} onChange={e=>setPayment(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-normal normal-case tracking-normal">{<option value="TODOS">Todos</option>}{payments.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-black/40">Plano<select value={plan} onChange={e=>setPlan(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-normal normal-case tracking-normal"><option value="TODOS">Todos</option>{plans.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-black/40">Nota fiscal<select value={invoice} onChange={e=>setInvoice(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-normal normal-case tracking-normal"><option value="TODOS">Todos</option><option>SIM</option><option>NÃO</option></select></label>
        <div className="flex flex-1 gap-2"><label className="min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-wide text-black/40">De<input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-black/10 px-2 text-sm font-normal"/></label><label className="min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-wide text-black/40">Até<input type="date" value={to} onChange={e=>setTo(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-black/10 px-2 text-sm font-normal"/></label></div>
        <button onClick={clear} className="h-10 rounded-xl px-3 text-xs font-semibold text-black/50 transition hover:bg-black/[.04]">Limpar</button>
      </div>
    </section>

    {loading?<div className="rounded-2xl border border-black/10 bg-white p-16 text-center text-sm text-black/45">Carregando painel...</div>:<>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Atendimentos realizados" value={String(m.attended)} detail={`${m.not} não realizados`} icon={CheckCircle2}/>
        <Kpi label="Recebimentos" value={money(m.paidValue)} detail={`${m.paid} pagamentos confirmados`} icon={WalletCards} positive/>
        <Kpi label="Notas fiscais" value={String(m.nf)} detail={money(m.nfValue)} icon={FileCheck2}/>
        <Kpi label="Valor contabilizado" value={money(m.total)} detail="Todos os registros filtrados" icon={CircleDollarSign}/>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr_1.45fr]">
        <div className="rounded-2xl border border-black/[.08] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,.035)]">
          <div className="mb-5"><h2 className="text-[15px] font-semibold">Recebimentos por método</h2><p className="mt-1 text-xs text-black/40">Somente pagamentos confirmados.</p></div>
          <div className="space-y-4">{m.methods.length?m.methods.map(([k,v])=><div key={k}><div className="mb-1.5 flex justify-between text-xs"><span className="font-medium">{k}</span><span className="font-semibold">{money(v.value)}</span></div><div className="h-2 overflow-hidden rounded-full bg-black/[.06]"><div className="h-full rounded-full bg-[#1f1f1f]" style={{width:`${m.paidValue?Math.max(4,(v.value/m.paidValue)*100):0}%`}}/></div><p className="mt-1 text-[11px] text-black/35">{v.count} pagamento(s)</p></div>):<p className="text-sm text-black/40">Nenhum pagamento no período.</p>}</div>
        </div>

        <div className="rounded-2xl border border-black/[.08] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,.035)]">
          <div className="mb-5"><h2 className="text-[15px] font-semibold">Distribuição por plano</h2><p className="mt-1 text-xs text-black/40">Atendimentos e valores informados.</p></div>
          <div className="space-y-3">{m.plans.slice(0,6).map(([k,v],i)=><div key={k} className="flex items-center justify-between border-b border-black/[.05] pb-3 last:border-0"><div className="flex min-w-0 items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/[.045] text-[11px] font-semibold">{i+1}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{k}</p><p className="text-[11px] text-black/35">{v.count} registro(s)</p></div></div><p className="text-sm font-semibold">{money(v.value)}</p></div>)}{!m.plans.length&&<p className="text-sm text-black/40">Nenhum plano encontrado.</p>}</div>
        </div>

        <div className="rounded-2xl border border-black/[.08] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,.035)]">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-[15px] font-semibold">Visão dos lançamentos</h2><p className="mt-1 text-xs text-black/40">{filtered.length} registro(s) na competência selecionada.</p></div><span className="rounded-full bg-black/[.045] px-2.5 py-1 text-[11px] font-medium text-black/50">{SOURCES.find(x=>x[0]===source)?.[1]}</span></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-black/[.08] text-[11px] uppercase tracking-wide text-black/35">{["Data","Plano","Status","Método","NF","Valor"].map(h=><th key={h} className="px-2.5 py-2 font-semibold">{h}</th>)}</tr></thead><tbody>{filtered.slice(0,12).map(r=><tr key={r.id} className="border-b border-black/[.045] last:border-0"><td className="px-2.5 py-3 whitespace-nowrap text-xs">{date(r.date)}</td><td className="px-2.5 py-3 text-xs">{r.plan||"—"}</td><td className="px-2.5 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${r.payment==="PAGO"?"bg-emerald-50 text-emerald-700":r.payment==="NÃO REALIZADO"?"bg-red-50 text-red-700":"bg-black/[.05] text-black/50"}`}>{r.payment||"—"}</span></td><td className="px-2.5 py-3 text-xs">{r.method||"—"}</td><td className="px-2.5 py-3 text-xs">{r.invoice==="SIM"?"Sim":"—"}</td><td className="px-2.5 py-3 text-right text-xs font-semibold">{r.value!==null?money(r.value):"—"}</td></tr>)}{filtered.length>12&&<tr><td colSpan={6} className="px-2.5 pt-3 text-center text-[11px] text-black/35">Exibindo os 12 primeiros lançamentos. Use os filtros para refinar a visão.</td></tr>}{!filtered.length&&<tr><td colSpan={6} className="px-2.5 py-10 text-center text-sm text-black/40">Nenhum lançamento encontrado.</td></tr>}</tbody></table></div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-black/[.08] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,.035)]">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="text-[15px] font-semibold">Resumo financeiro</h2><p className="mt-1 text-xs text-black/40">Competência {SOURCES.find(x=>x[0]===source)?.[1]}</p></div><div className="text-right"><p className="text-[11px] text-black/35">Valor informado</p><p className="text-lg font-semibold">{money(m.total)}</p></div></div>
        <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-black/[.025] p-4"><p className="text-xs text-black/40">Recebido</p><p className="mt-1 text-lg font-semibold">{money(m.paidValue)}</p></div><div className="rounded-xl bg-black/[.025] p-4"><p className="text-xs text-black/40">Em aberto / não confirmado</p><p className="mt-1 text-lg font-semibold">{money(Math.max(0,m.total-m.paidValue))}</p></div><div className="rounded-xl bg-black/[.025] p-4"><p className="text-xs text-black/40">Notas fiscais</p><p className="mt-1 text-lg font-semibold">{m.nf} <span className="text-xs font-normal text-black/40">· {money(m.nfValue)}</span></p></div></div>
      </section>
    </>}
  </main></AppShell></div></AuthGuard>;
}
