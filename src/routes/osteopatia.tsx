import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, FileText, RefreshCw, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { AuthGuard } from "@/components/AuthGuard";

export const Route = createFileRoute("/osteopatia")({ component: Osteopatia });

const SHEET_ID = "17h3G-GNIUNJMBN5UlIYQNgRR_OUHVDb4";
const SOURCES = [
  ["202610", "Outubro/2026"],
  ["202609", "Setembro/2026"],
  ["202611", "Novembro/2026"],
  ["202612", "Dezembro/2026"],
  ["Nota meses pendentes", "Meses pendentes"],
] as const;

type Row = { id:string; tab:string; date:Date|null; plan:string; payment:string; method:string; paymentDate:Date|null; invoice:string; invoiceNumber:string; value:number|null };

function parseDate(v:unknown):Date|null {
  if (typeof v !== "string") return null;
  const m=v.match(/Date\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+),\s*(\d+),\s*(\d+))?/);
  if (m) return new Date(+m[1],+m[2],+m[3],+(m[4]||0),+(m[5]||0),+(m[6]||0));
  const d=new Date(v); return Number.isNaN(d.getTime())?null:d;
}
function num(v:unknown):number|null {
  if(typeof v==="number" && Number.isFinite(v)) return v;
  if(typeof v!=="string") return null;
  const n=Number(v.replace(/R\$\s?/gi,"").replace(/\./g,"").replace(",",".").trim());
  return Number.isFinite(n)?n:null;
}
function money(v:number){return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});}
function fmtDate(v:Date|null){return v?v.toLocaleDateString("pt-BR"):"—";}

async function readTab(tab:string):Promise<Row[]> {
  const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tab)}`;
  const res=await fetch(url,{cache:"no-store"});
  if(!res.ok) throw new Error(`Não foi possível ler a aba ${tab}.`);
  const text=await res.text(), a=text.indexOf("{"), b=text.lastIndexOf("}");
  if(a<0||b<a) throw new Error("O Google Sheets não retornou dados legíveis.");
  const data=JSON.parse(text.slice(a,b+1)) as {table?:{rows?:Array<{c?:Array<{v?:unknown}|null>}>}};
  const rows=data.table?.rows??[];
  return rows.map((r,i)=>{
    const c=(n:number)=>r.c?.[n]?.v??"";
    return {id:`${tab}-${i}`,tab,date:parseDate(c(2)),plan:String(c(4)||"").trim(),payment:String(c(5)||"").trim().toUpperCase(),method:String(c(6)||"").trim(),paymentDate:parseDate(c(7)),invoice:String(c(8)||"").trim().toUpperCase(),invoiceNumber:String(c(10)||"").trim(),value:num(c(9))};
  }).filter(r=>r.plan||r.payment||r.value!==null||r.date);
}

function Card({title,value,detail,icon:Icon}:{title:string;value:string;detail:string;icon:typeof Wallet}){
  return <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"><div className="flex justify-between gap-3"><div><p className="text-sm text-black/50">{title}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-black/40">{detail}</p></div><div className="rounded-xl border border-black/10 p-2.5"><Icon size={18} className="text-black/55"/></div></div></div>;
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
    if(payment!=="TODOS"&&r.payment!==payment)return false;
    if(plan!=="TODOS"&&r.plan!==plan)return false;
    if(invoice!=="TODOS"&&r.invoice!==invoice)return false;
    if(from&&r.date&&r.date<new Date(from+"T00:00:00"))return false;
    if(to&&r.date&&r.date>new Date(to+"T23:59:59"))return false;
    return true;
  }),[rows,payment,plan,invoice,from,to]);
  const m=useMemo(()=>{
    const paid=filtered.filter(r=>r.payment==="PAGO"),not=filtered.filter(r=>r.payment==="NÃO REALIZADO"),nfs=filtered.filter(r=>r.invoice==="SIM");
    const methods=new Map<string,{count:number;value:number}>();
    paid.forEach(r=>{const k=r.method||"Não informado",x=methods.get(k)||{count:0,value:0};x.count++;x.value+=r.value??0;methods.set(k,x)});
    return {attended:filtered.filter(r=>r.payment!=="NÃO REALIZADO").length,not: not.length,paid:paid.length,paidValue:paid.reduce((s,r)=>s+(r.value??0),0),value:filtered.reduce((s,r)=>s+(r.value??0),0),nf:nfs.length,nfValue:nfs.reduce((s,r)=>s+(r.value??0),0),methods:[...methods.entries()].sort((a,b)=>b[1].value-a[1].value)};
  },[filtered]);

  const clear=()=>{setPayment("TODOS");setPlan("TODOS");setInvoice("TODOS");setFrom("");setTo("")};

  return <AuthGuard><div className="min-h-screen bg-[#f8f8f7]"><TopBar/><AppShell><div className="mx-auto max-w-7xl pb-10">
    <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-medium text-black/45">Módulo</p><h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Osteopatia</h1><p className="mt-2 text-sm text-black/55">Dashboard conectado diretamente à planilha de agenda. A planilha continua sendo a fonte dos dados.</p></div><button onClick={()=>void load(true)} disabled={refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-medium shadow-sm"><RefreshCw size={16} className={refreshing?"animate-spin":""}/>Atualizar agora</button></div>
    {error&&<div className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={18}/><div><b>Não foi possível atualizar a planilha.</b><p className="mt-1">{error}</p><p className="mt-2 text-xs">Confirme que o arquivo está compartilhado como “Qualquer pessoa com o link — Leitor”.</p></div></div>}
    <div className="mb-6 rounded-2xl border border-black/10 bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
      <label className="text-xs font-medium text-black/55 lg:col-span-2">Competência / origem<select value={source} onChange={e=>setSource(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm">{SOURCES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
      <label className="text-xs font-medium text-black/55">Pagamento<select value={payment} onChange={e=>setPayment(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm"><option value="TODOS">Todos</option>{payments.map(x=><option key={x}>{x}</option>)}</select></label>
      <label className="text-xs font-medium text-black/55">Plano<select value={plan} onChange={e=>setPlan(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm"><option value="TODOS">Todos</option>{plans.map(x=><option key={x}>{x}</option>)}</select></label>
      <label className="text-xs font-medium text-black/55">Nota fiscal<select value={invoice} onChange={e=>setInvoice(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm"><option value="TODOS">Todos</option><option>SIM</option><option>NÃO</option></select></label>
      <button onClick={clear} className="mt-auto h-10 rounded-xl border border-black/10 bg-black/[0.025] px-3 text-sm font-medium">Limpar filtros</button>
    </div><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:max-w-md"><label className="text-xs font-medium text-black/55">Data inicial<input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-black/10 px-3 text-sm"/></label><label className="text-xs font-medium text-black/55">Data final<input type="date" value={to} onChange={e=>setTo(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-black/10 px-3 text-sm"/></label></div></div>
    {loading?<div className="rounded-2xl border border-black/10 bg-white p-12 text-center text-sm text-black/45">Carregando dados da planilha...</div>:<>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Card title="Atendimentos" value={String(m.attended)} detail={`${m.not} não realizados`} icon={CheckCircle2}/><Card title="Pagamentos recebidos" value={money(m.paidValue)} detail={`${m.paid} registros pagos`} icon={Wallet}/><Card title="Notas fiscais" value={String(m.nf)} detail={money(m.nfValue)} icon={FileText}/><Card title="Valores informados" value={money(m.value)} detail="Soma dos valores preenchidos" icon={Wallet}/></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.8fr]"><section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"><h2 className="font-semibold">Pagamentos por método</h2><p className="mt-1 text-xs text-black/45">Somente registros marcados como PAGO.</p><div className="mt-5 space-y-3">{m.methods.length?m.methods.map(([k,v])=><div key={k} className="flex justify-between border-b border-black/5 pb-3 last:border-0"><div><p className="text-sm font-medium">{k}</p><p className="text-xs text-black/40">{v.count} pagamento(s)</p></div><b className="text-sm">{money(v.value)}</b></div>):<p className="text-sm text-black/45">Nenhum pagamento.</p>}</div></section>
      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"><div className="mb-4 flex justify-between"><div><h2 className="font-semibold">Registros da planilha</h2><p className="mt-1 text-xs text-black/45">{filtered.length} registro(s) · {SOURCES.find(x=>x[0]===source)?.[1]}</p></div><span className="text-xs text-black/40">Atualização automática: 60s</span></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b border-black/10 text-xs text-black/45">{["Data","Plano","Pagamento","Método","Data pagamento","Nota fiscal","Valor"].map(h=><th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead><tbody>{filtered.map(r=><tr key={r.id} className="border-b border-black/5"><td className="px-3 py-3">{fmtDate(r.date)}</td><td className="px-3 py-3">{r.plan||"—"}</td><td className="px-3 py-3">{r.payment||"—"}</td><td className="px-3 py-3">{r.method||"—"}</td><td className="px-3 py-3">{fmtDate(r.paymentDate)}</td><td className="px-3 py-3">{r.invoice||"—"}{r.invoiceNumber&&<div className="text-xs text-black/40">{r.invoiceNumber}</div>}</td><td className="px-3 py-3 text-right font-medium">{r.value!==null?money(r.value):"—"}</td></tr>)}{!filtered.length&&<tr><td colSpan={7} className="px-3 py-10 text-center text-black/40">Nenhum registro encontrado.</td></tr>}</tbody></table></div></section></div>
    </>}
  </div></AppShell></div></AuthGuard>;
}
