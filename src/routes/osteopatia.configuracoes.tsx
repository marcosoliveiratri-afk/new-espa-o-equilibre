import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Link2, RefreshCw, Settings2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { AuthGuard } from "@/components/AuthGuard";

export const Route = createFileRoute("/osteopatia/configuracoes")({ component: OsteopatiaConfiguracoes });

export const OSTEOPATIA_SHEET_STORAGE_KEY = "equilibre:osteopatia:google-sheet-url";
export const DEFAULT_OSTEOPATIA_SHEET_ID = "17h3G-GNIUNJMBN5UlIYQNgRR_OUHVDb4";

function sheetIdFromUrl(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] || "";
}

async function testSheet(url: string) {
  const id = sheetIdFromUrl(url) || (url.trim().match(/^[a-zA-Z0-9-_]{20,}$/)?.[0] ?? "");
  if (!id) throw new Error("Cole um link válido do Google Sheets.");
  const endpoint = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&sheet=202610`;
  const response = await fetch(endpoint, { cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível acessar a planilha. Verifique o compartilhamento.");
  const text = await response.text();
  if (!text.includes("google.visualization") && !text.includes('"table"')) {
    throw new Error("O Google Sheets não retornou dados. Deixe a planilha como “Qualquer pessoa com o link — Leitor”.");
  }
  return id;
}

function OsteopatiaConfiguracoes() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(OSTEOPATIA_SHEET_STORAGE_KEY);
    setUrl(saved || `https://docs.google.com/spreadsheets/d/${DEFAULT_OSTEOPATIA_SHEET_ID}/edit`);
  }, []);

  async function save() {
    setStatus("testing");
    setMessage("");
    try {
      const id = await testSheet(url);
      window.localStorage.setItem(OSTEOPATIA_SHEET_STORAGE_KEY, url.trim());
      window.localStorage.setItem("equilibre:osteopatia:google-sheet-id", id);
      setStatus("success");
      setMessage("Planilha conectada com sucesso.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Não foi possível conectar.");
    }
  }

  return <AuthGuard><div className="min-h-screen bg-[#f7f7f6]"><TopBar/><AppShell><main className="mx-auto max-w-[1050px] pb-12">
    <div className="mb-7 flex items-center gap-3">
      <Link to="/osteopatia" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white shadow-sm hover:bg-black/[.02]"><ArrowLeft size={17}/></Link>
      <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-black/35">Osteopatia</p><h1 className="mt-1 text-[30px] font-semibold tracking-[-.03em]">Configurações</h1><p className="mt-1 text-sm text-black/45">Defina a planilha que será usada como fonte de dados do painel.</p></div>
    </div>
    <section className="rounded-2xl border border-black/[.08] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,.035)]">
      <div className="flex items-start gap-4"><div className="rounded-xl bg-black/[.04] p-3"><Settings2 size={20}/></div><div><h2 className="text-base font-semibold">Fonte de dados</h2><p className="mt-1 text-sm text-black/45">Google Sheets é a fonte oficial. O sistema não copia os lançamentos para o banco.</p></div></div>
      <label className="mt-7 block text-xs font-semibold uppercase tracking-wide text-black/45">Link da planilha
        <div className="mt-2 flex flex-col gap-2 md:flex-row"><div className="relative flex-1"><Link2 size={16} className="absolute left-3 top-3 text-black/30"/><input value={url} onChange={e=>{setUrl(e.target.value);setStatus("idle");setMessage("")}} placeholder="https://docs.google.com/spreadsheets/d/..." className="h-11 w-full rounded-xl border border-black/10 bg-white pl-9 pr-3 text-sm outline-none focus:border-black/25"/></div><button onClick={()=>void save()} disabled={status==="testing" || !url.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-medium text-white disabled:opacity-50"><RefreshCw size={15} className={status==="testing"?"animate-spin":""}/>Salvar e testar</button></div>
      </label>
      {status!=="idle"&&<div className={`mt-4 flex items-center gap-2 rounded-xl border p-3 text-sm ${status==="success"?"border-emerald-200 bg-emerald-50 text-emerald-700":"border-red-200 bg-red-50 text-red-700"}`}>{status==="success"&&<CheckCircle2 size={17}/>}<span>{message}</span></div>}
      <div className="mt-7 rounded-xl bg-black/[.025] p-4 text-sm text-black/55"><p className="font-semibold text-black/70">Como conectar</p><ol className="mt-2 list-decimal space-y-1.5 pl-5"><li>Abra a planilha no Google Sheets.</li><li>Clique em <b>Compartilhar</b>.</li><li>Em acesso geral, selecione <b>Qualquer pessoa com o link → Leitor</b>.</li><li>Cole o link acima e clique em <b>Salvar e testar</b>.</li></ol></div>
    </section>
    <div className="mt-5 flex justify-end"><button onClick={()=>navigate({to:"/osteopatia"})} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium hover:bg-black/[.02]">Voltar ao painel</button></div>
  </main></AppShell></div></AuthGuard>;
}
