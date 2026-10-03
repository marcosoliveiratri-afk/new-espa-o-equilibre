import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, CalendarDays, CheckCircle2, CircleDollarSign, FileCheck2, RefreshCw, Settings, WalletCards } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { AuthGuard } from "@/components/AuthGuard";

export const Route = createFileRoute("/osteopatia")({ component: Osteopatia });

const DEFAULT_SHEET_ID = "17h3G-GNIUNJMBN5UlIYQNgRR_OUHVDb4";
const SHEET_STORAGE_KEY = "equilibre:osteopatia:google-sheet-id";
const SOURCES = [
  ["202609", "Setembro/2026"],
  ["202610", "Outubro/2026"],
  ["202611", "Novembro/2026"],
  ["202612", "Dezembro/2026"],
] as const;

type Row = {
  id: string; date: Date | null; plan: string; payment: string; method: string;
  paymentDate: Date | null; invoice: string; invoiceNumber: string; value: number | null;
};

function parseDate(v: unknown): Date | null {
  if (typeof v !== "string") return null;
  const m = v.match(/Date\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+),\s*(\d+),\s*(\d+))?/);
  if (m) return new Date(+m[1], +m[2], +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v !== "string") return null;
  const n = Number(v.replace(/R\$\s?/gi, "").replace(/\./g, "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}
function money(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }); }
function dayLabel(v: Date | null) { return v ? v.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "—"; }

async function readTab(tab: string): Promise<Row[]> {
  const sheetId = typeof window !== "undefined"
    ? (window.localStorage.getItem(SHEET_STORAGE_KEY) || DEFAULT_SHEET_ID)
    : DEFAULT_SHEET_ID;
  const res = await fetch(
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tab)}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error(`Não foi possível ler a aba ${tab}.`);
  const text = await res.text();
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a < 0 || b < a) throw new Error("O Google Sheets não retornou dados legíveis.");
  const data = JSON.parse(text.slice(a, b + 1)) as { table?: { rows?: Array<{ c?: Array<{ v?: unknown } | null> }> } };
  return (data.table?.rows ?? []).map((r, i) => {
    const c = (n: number) => r.c?.[n]?.v ?? "";
    return {
      id: `${tab}-${i}`,
      date: parseDate(c(2)),
      plan: String(c(4) || "").trim(),
      payment: String(c(5) || "").trim().toUpperCase(),
      method: String(c(6) || "").trim(),
      paymentDate: parseDate(c(7)),
      invoice: String(c(8) || "").trim().toUpperCase(),
      invoiceNumber: String(c(10) || "").trim(),
      value: num(c(9)),
    };
  }).filter(r => r.plan || r.payment || r.value !== null || r.date);
}

function Kpi({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof WalletCards }) {
  return (
    <div className="rounded-[14px] border border-[#e5e5e5] bg-white p-[17px]">
      <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[#f4f4f5] text-[#52525b]"><Icon size={16} strokeWidth={1.8}/></div>
      <p className="mt-4 text-[12px] text-[#52525b]">{label}</p>
      <p className="mt-0.5 text-[24px] font-bold tracking-[-.6px] leading-[1.15]">{value}</p>
      <p className="mt-1 text-[11px] text-[#71717a]">{detail}</p>
    </div>
  );
}

function DailyChart({ rows }: { rows: Row[] }) {
  const data = useMemo(() => {
    const map = new Map<string, { label: string; invoice: number; noInvoice: number }>();
    rows.filter(r => r.payment === "PAGO" && r.date).forEach(r => {
      const key = r.date!.toISOString().slice(0, 10);
      const x = map.get(key) || { label: dayLabel(r.date), invoice: 0, noInvoice: 0 };
      if (r.invoice === "SIM") x.invoice += r.value ?? 0; else x.noInvoice += r.value ?? 0;
      map.set(key, x);
    });
    return [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([,v])=>v).slice(-22);
  }, [rows]);
  const max = Math.max(...data.map(x => x.invoice + x.noInvoice), 1);
  const w = 620, h = 205, left = 38, right = 12, bottom = 27, top = 12;
  const plotW = w-left-right, plotH = h-top-bottom;
  const barW = Math.max(7, Math.min(13, plotW / Math.max(data.length,1) * .55));
  return (
    <div className="mt-2 overflow-hidden">
      {data.length ? (
        <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full">
          {[0,.25,.5,.75,1].map((p,i)=><g key={i}><line x1={left} x2={w-right} y1={top+plotH*(1-p)} y2={top+plotH*(1-p)} stroke="#e5e5e5" strokeDasharray={i===0?"0":"3 4"}/><text x={left-7} y={top+plotH*(1-p)+3} textAnchor="end" fontSize="8" fill="#71717a">{p===0?"0":p===1?money(max):money(max*p)}</text></g>)}
          {data.map((d,i)=>{
            const x=left+(i+.5)*plotW/data.length, total=d.invoice+d.noInvoice;
            const noH=d.noInvoice/max*plotH, invH=d.invoice/max*plotH;
            return <g key={i}>
              <rect x={x-barW/2} y={top+plotH-noH} width={barW} height={noH} rx="2.5" fill="#BEDCF4"/>
              <rect x={x-barW/2} y={top+plotH-noH-invH} width={barW} height={invH} rx="2.5" fill="#D6CDF6"/>
              <title>{d.label} · Com nota {money(d.invoice)} · Sem nota {money(d.noInvoice)} · Total {money(total)}</title>
              {(i===0 || i===data.length-1 || i%5===0) && <text x={x} y={h-7} textAnchor="middle" fontSize="8" fill="#71717a">{d.label}</text>}
            </g>;
          })}
        </svg>
      ) : <div className="flex h-48 items-center justify-center text-sm text-[#71717a]">Sem receita diária para o período.</div>}
    </div>
  );
}

function Osteopatia() {
  const [source, setSource] = useState("202610");
  const [rows, setRows] = useState<Row[]>([]);
  const [allRows, setAllRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState("TODOS");
  const [plan, setPlan] = useState("TODOS");
  const [invoice, setInvoice] = useState("TODOS");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async (manual = false) => {
    try {
      manual ? setRefreshing(true) : setLoading(true);
      setError("");
      const selected = await readTab(source);
      const comparison = source === "202610" ? await readTab("202609") : selected;
      setRows(selected);
      setAllRows([...comparison, ...selected]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar a planilha.");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [source]);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(true), 60000);
    return () => window.clearInterval(t);
  }, [load]);

  const plans = useMemo(() => Array.from(new Set(rows.map(r => r.plan).filter(Boolean))).sort(), [rows]);
  const payments = useMemo(() => Array.from(new Set(rows.map(r => r.payment).filter(Boolean))).sort(), [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    if (payment !== "TODOS" && r.payment !== payment) return false;
    if (plan !== "TODOS" && r.plan !== plan) return false;
    if (invoice !== "TODOS" && r.invoice !== invoice) return false;
    if (from && r.date && r.date < new Date(from + "T00:00:00")) return false;
    if (to && r.date && r.date > new Date(to + "T23:59:59")) return false;
    return true;
  }), [rows, payment, plan, invoice, from, to]);

  const metrics = useMemo(() => {
    const paid = filtered.filter(r => r.payment === "PAGO");
    const not = filtered.filter(r => r.payment === "NÃO REALIZADO");
    const nfs = paid.filter(r => r.invoice === "SIM");
    const toIssue = paid.filter(r => r.invoice !== "SIM");
    const paidValue = paid.reduce((s,r)=>s+(r.value??0),0);
    const nfValue = nfs.reduce((s,r)=>s+(r.value??0),0);
    const methods = new Map<string,{count:number;value:number}>();
    paid.forEach(r => { const k=r.method||"Não informado"; const x=methods.get(k)||{count:0,value:0}; x.count++; x.value+=r.value??0; methods.set(k,x); });
    const planMap = new Map<string,{count:number;value:number}>();
    paid.forEach(r => { const k=r.plan||"Não informado"; const x=planMap.get(k)||{count:0,value:0}; x.count++; x.value+=r.value??0; planMap.set(k,x); });
    return {
      attended: paid.length, not: not.length, paidValue, nf:nfs.length, nfValue,
      toIssue:toIssue.length, toIssueValue:toIssue.reduce((s,r)=>s+(r.value??0),0),
      methods:[...methods.entries()].sort((a,b)=>b[1].value-a[1].value),
      plans:[...planMap.entries()].sort((a,b)=>b[1].value-a[1].value),
    };
  }, [filtered]);

  const period = useMemo(() => {
    const paid = allRows.filter(r=>r.payment==="PAGO");
    const value = paid.reduce((s,r)=>s+(r.value??0),0);
    const nf = paid.filter(r=>r.invoice==="SIM");
    return { value, count:paid.length, nfValue:nf.reduce((s,r)=>s+(r.value??0),0), nf:nf.length };
  }, [allRows]);

  const clear = () => { setPayment("TODOS"); setPlan("TODOS"); setInvoice("TODOS"); setFrom(""); setTo(""); };

  return <AuthGuard>
    <div className="min-h-screen bg-white text-[#0a0a0a]">
      <TopBar/>
      <AppShell>
        <main className="mx-auto max-w-[1040px] pb-10">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e5e5] pb-4">
            <div className="flex items-center gap-2.5 text-[14px] font-semibold">
              <div className="flex h-7 w-7 items-center justify-center rounded-full text-white" style={{background:"radial-gradient(circle at 30% 30%,#e3b7a6,#a8705e)"}}>
                <CircleDollarSign size={15}/>
              </div>
              Espaço Equilibre
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex h-8 items-center gap-1.5 rounded-lg border border-transparent bg-[#FDF0E7] px-3 text-xs font-medium text-[#C2643A]"><CalendarDays size={13}/>{SOURCES.find(x=>x[0]===source)?.[1]}</div>
              <Link to="/osteopatia/configuracoes" className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e5e5e5] px-3 text-xs font-medium"><Settings size={13}/>Configurações</Link>
              <button onClick={()=>void load(true)} disabled={refreshing} className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e5e5e5] px-3 text-xs font-medium disabled:opacity-50"><RefreshCw size={13} className={refreshing?"animate-spin":""}/>Atualizar</button>
            </div>
          </header>

          <div className="py-5">
            <h1>Painel de Notas Fiscais e Atendimentos</h1>
            <p className="mt-1 text-xs text-[#71717a]">Visão consolidada da Osteopatia · dados atualizados diretamente da Google Sheets</p>
          </div>

          {error && <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle size={17}/><div><b>Não foi possível atualizar os dados.</b><p className="mt-1">{error}</p></div></div>}

          <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Receita recebida" value={money(metrics.paidValue)} detail={`${metrics.attended} atendimentos pagos`} icon={WalletCards}/>
            <Kpi label="Atendimentos pagos" value={String(metrics.attended)} detail={`Ticket médio ${money(metrics.attended ? metrics.paidValue/metrics.attended : 0)}`} icon={CheckCircle2}/>
            <Kpi label="Notas fiscais" value={String(metrics.nf)} detail={money(metrics.nfValue)} icon={FileCheck2}/>
            <Kpi label="Notas a emitir" value={String(metrics.toIssue)} detail={`${money(metrics.toIssueValue)} aguardando emissão`} icon={CircleDollarSign}/>
          </section>

          <section className="mb-5 rounded-[14px] border border-[#e5e5e5] bg-white p-4">
            <div className="grid gap-2 md:grid-cols-5">
              <label className="text-[11px] text-[#52525b]">Competência<select value={source} onChange={e=>setSource(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-[#e5e5e5] bg-white px-2 text-xs"><option value="202609">Setembro/2026</option><option value="202610">Outubro/2026</option><option value="202611">Novembro/2026</option><option value="202612">Dezembro/2026</option></select></label>
              <label className="text-[11px] text-[#52525b]">Pagamento<select value={payment} onChange={e=>setPayment(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-[#e5e5e5] bg-white px-2 text-xs"><option value="TODOS">Todos</option>{payments.map(x=><option key={x}>{x}</option>)}</select></label>
              <label className="text-[11px] text-[#52525b]">Plano<select value={plan} onChange={e=>setPlan(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-[#e5e5e5] bg-white px-2 text-xs"><option value="TODOS">Todos</option>{plans.map(x=><option key={x}>{x}</option>)}</select></label>
              <label className="text-[11px] text-[#52525b]">Nota fiscal<select value={invoice} onChange={e=>setInvoice(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-[#e5e5e5] bg-white px-2 text-xs"><option value="TODOS">Todos</option><option value="SIM">SIM</option><option value="NÃO">NÃO</option></select></label>
              <button onClick={clear} className="mt-4 h-9 rounded-lg px-3 text-xs font-semibold text-[#71717a] hover:bg-[#f4f4f5]">Limpar filtros</button>
            </div>
          </section>

          {loading ? <div className="rounded-[14px] border border-[#e5e5e5] bg-white p-16 text-center text-sm text-[#71717a]">Carregando painel...</div> : <>
            <h2>Receita</h2>
            <section className="grid gap-3 lg:grid-cols-[1.8fr_1fr]">
              <div className="rounded-[14px] border border-[#e5e5e5] bg-white p-[17px]">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[13px] font-semibold">Receita diária</div><div className="mt-0.5 text-[11px] text-[#71717a]">Valor recebido por dia, separado por nota fiscal</div></div><div className="flex gap-3 text-[11px] text-[#52525b]"><span><i className="mr-1 inline-block h-2 w-2 rounded-[3px] bg-[#D6CDF6]"/>Com nota</span><span><i className="mr-1 inline-block h-2 w-2 rounded-[3px] bg-[#BEDCF4]"/>Sem nota</span></div></div>
                <DailyChart rows={filtered}/>
                <p className="mt-1 text-[10.5px] text-[#71717a]">Somente pagamentos confirmados entram no gráfico.</p>
              </div>
              <div className="rounded-[14px] border border-[#e5e5e5] bg-white p-[17px]">
                <div className="text-[13px] font-semibold">Receita por tipo de atendimento</div>
                <div className="mt-0.5 text-[11px] text-[#71717a]">Distribuição por plano</div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="relative h-36 w-36 shrink-0">
                    <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
                      <circle cx="80" cy="80" r="58" fill="none" stroke="#f4f4f5" strokeWidth="22"/>
                      {(() => { let offset=0; return metrics.plans.slice(0,4).map(([k,v],i)=>{const pct=metrics.paidValue?v.value/metrics.paidValue:0; const colors=["#BFE8D6","#BEDCF4","#D6CDF6","#FBD5C0"]; const dash=364.42*pct; const el=<circle key={k} cx="80" cy="80" r="58" fill="none" stroke={colors[i]} strokeWidth="22" strokeDasharray={`${dash} 364.42`} strokeDashoffset={-offset} />; offset+=dash; return el;}); })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center"><b className="text-[15px]">{money(metrics.paidValue)}</b><span className="text-[8px] tracking-[.6px] text-[#71717a]">RECEBIDO</span></div>
                  </div>
                  <div className="min-w-[150px] flex-1 space-y-3">
                    {metrics.plans.slice(0,4).map(([k,v],i)=><div key={k} className="grid grid-cols-[12px_1fr_auto] items-center gap-2 text-xs"><i className="h-2 w-2 rounded-full" style={{background:["#BFE8D6","#BEDCF4","#D6CDF6","#FBD5C0"][i]}}/><span>{k}</span><b>{metrics.paidValue?Math.round(v.value/metrics.paidValue*100):0}%</b><em className="col-start-2 col-end-4 text-[11px] not-italic text-[#71717a]">{money(v.value)}</em></div>)}
                  </div>
                </div>
              </div>
            </section>

            <h2>Notas fiscais e pagamentos</h2>
            <section className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-[14px] border border-[#e5e5e5] bg-white p-[17px]">
                <div className="text-[13px] font-semibold">Situação das notas fiscais</div>
                <div className="mt-0.5 text-[11px] text-[#71717a]">Emitidas × a emitir</div>
                <div className="mt-5 flex items-center gap-4">
                  <div className="relative h-24 w-24 shrink-0"><svg viewBox="0 0 104 104" className="h-full w-full -rotate-90"><circle cx="52" cy="52" r="40" fill="none" stroke="#FBD5C0" strokeWidth="12"/><circle cx="52" cy="52" r="40" fill="none" stroke="#BFE8D6" strokeWidth="12" strokeDasharray={`${251.3*(metrics.nf/(metrics.nf+metrics.toIssue||1))} 251.3`} strokeLinecap="round"/></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><b className="text-xl">{metrics.nf+metrics.toIssue ? Math.round(metrics.nf/(metrics.nf+metrics.toIssue)*100):0}%</b><span className="text-[7px] tracking-[.5px] text-[#71717a]">EMITIDAS</span></div></div>
                  <div className="flex-1"><div className="mb-1 flex justify-between text-xs"><b>Período</b><span className="text-[11px] text-[#71717a]">{metrics.nf} notas · {money(metrics.nfValue)}</span></div><div className="flex h-5 gap-0.5 overflow-hidden rounded-full"><div className="flex items-center justify-center bg-[#BFE8D6] text-[11px] font-bold text-[#2E8B68]" style={{width:`${Math.max(22,metrics.nf/(metrics.nf+metrics.toIssue||1)*100)}%`}}>{metrics.nf}</div><div className="flex flex-1 items-center justify-center bg-[#FBD5C0] text-[11px] font-bold text-[#C2643A]">{metrics.toIssue}</div></div></div>
                </div>
                <div className="mt-4 rounded-[10px] bg-[#FDF0E7] px-3 py-2.5 text-xs"><b className="text-[#C2643A]">{metrics.toIssue} notas</b> a emitir · {money(metrics.toIssueValue)}</div>
              </div>

              <div className="rounded-[14px] border border-[#e5e5e5] bg-white p-[17px]">
                <div className="text-[13px] font-semibold">Formas de pagamento</div><div className="mt-0.5 text-[11px] text-[#71717a]">Por valor recebido · participação no total</div>
                <div className="mt-4 space-y-3.5">{metrics.methods.map(([k,v],i)=>{const colors=["#BEDCF4","#BFE8D6","#F7EBB8","#D6CDF6","#F6D0DB"]; const pct=metrics.paidValue?v.value/metrics.paidValue*100:0; return <div key={k}><div className="mb-1 flex justify-between text-xs"><span>{k}</span><b>{money(v.value)}</b></div><div className="h-2 rounded bg-[#f4f4f5]"><div className="h-2 rounded" style={{width:`${Math.max(pct,2)}%`,background:colors[i%colors.length]}}/></div><div className="mt-1 text-[10px] text-[#71717a]">{Math.round(pct)}%</div></div>})}</div>
              </div>

              <div className="rounded-[14px] border border-[#e5e5e5] bg-white p-[17px]">
                <div className="text-[13px] font-semibold">Comparativo mensal</div><div className="mt-0.5 text-[11px] text-[#71717a]">Indicadores principais</div>
                <table className="mt-3 w-full text-xs"><thead><tr><th className="pb-2 text-left text-[11px] font-medium text-[#71717a]"></th><th className="pb-2 text-right"><span className="rounded-lg bg-[#3B78AD] px-2.5 py-1 text-[10px] font-semibold text-white">Setembro</span></th><th className="pb-2 text-right"><span className="rounded-lg bg-[#C2643A] px-2.5 py-1 text-[10px] font-semibold text-white">Outubro</span></th></tr></thead><tbody>{(() => { const set=allRows.filter(r=>r.payment==="PAGO"&&r.date&&r.date.getMonth()===8); const out=allRows.filter(r=>r.payment==="PAGO"&&r.date&&r.date.getMonth()===9); const calc=(a:Row[])=>({count:a.length,value:a.reduce((s,r)=>s+(r.value??0),0),nf:a.filter(r=>r.invoice==="SIM"),no:a.filter(r=>r.invoice!=="SIM")}); const a=calc(set),b=calc(out); return [["Atendimentos pagos",a.count,b.count],["Receita recebida",money(a.value),money(b.value)],["Receita com nota",money(a.nf.reduce((s,r)=>s+(r.value??0),0)),money(b.nf.reduce((s,r)=>s+(r.value??0),0))],["Receita sem nota",money(a.no.reduce((s,r)=>s+(r.value??0),0)),money(b.no.reduce((s,r)=>s+(r.value??0),0))],["Notas fiscais (SIM)",a.nf.length,b.nf.length],["Notas a emitir",a.no.length,b.no.length]].map((x,i)=><tr key={i}><td className="border-t border-[#e5e5e5] py-2 text-left text-[#52525b]">{x[0]}</td><td className="border-t border-[#e5e5e5] py-2 text-right font-semibold">{x[1]}</td><td className="border-t border-[#e5e5e5] py-2 text-right font-semibold">{x[2]}</td></tr>); })()}</tbody></table>
              </div>
            </section>

            <div className="mt-5 rounded-[14px] border border-[#e5e5e5] bg-white p-[17px]">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><div className="text-[13px] font-semibold">Lançamentos da competência</div><div className="mt-0.5 text-[11px] text-[#71717a]">{filtered.length} registro(s) · sem nomes de pacientes ou responsáveis</div></div><span className="rounded-[9px] bg-[#F4F4F5] px-2.5 py-1 text-[10px] text-[#71717a]">{SOURCES.find(x=>x[0]===source)?.[1]}</span></div>
              <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[680px] text-xs"><thead><tr><th className="py-2 text-left">Data</th><th className="py-2 text-left">Plano</th><th className="py-2 text-right">Status</th><th className="py-2 text-right">Método</th><th className="py-2 text-right">NF</th><th className="py-2 text-right">Valor</th></tr></thead><tbody>{filtered.slice(0,20).map(r=><tr key={r.id}><td className="text-left">{dayLabel(r.date)}</td><td className="text-left">{r.plan||"—"}</td><td><span className={`rounded-lg px-2 py-1 text-[10px] font-bold ${r.payment==="PAGO"?"bg-[#BFE8D6] text-[#2E8B68]":"bg-[#FBD5C0] text-[#C2643A]"}`}>{r.payment||"—"}</span></td><td>{r.method||"—"}</td><td>{r.invoice==="SIM"?"SIM":"—"}</td><td>{r.value!==null?money(r.value):"—"}</td></tr>)}</tbody></table></div>
            </div>

            <footer className="mt-5 flex flex-wrap justify-between gap-2 text-[10.5px] text-[#71717a]"><span>Fonte: Google Sheets · abas 202609 e 202610 · sem nomes de pacientes ou responsáveis</span><span>Atualização automática a cada 60 segundos</span></footer>
          </>}
        </main>
      </AppShell>
    </div>
  </AuthGuard>;
}
