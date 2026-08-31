import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#111]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_90%_80%,rgba(255,255,255,0.08),transparent_30%)]" />
      <section className="relative hidden flex-1 flex-col justify-between p-10 text-white lg:flex xl:p-16">
        <div>
          <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-lg font-semibold">E</div>
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/45">Espaço Equilibre</p>
          <h1 className="mt-6 max-w-xl text-5xl font-semibold leading-[1.05] tracking-tight xl:text-6xl">Gestão simples para um estúdio em equilíbrio.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/55">Organize alunos, aulas, agenda e a rotina do seu estúdio em um único lugar.</p>
        </div>
        <p className="text-xs text-white/35">Sistema de gestão para estúdios de Pilates</p>
      </section>

      <section className="relative flex w-full items-center justify-center bg-[#f7f7f5] px-5 py-10 sm:px-8 lg:max-w-[560px] lg:rounded-l-[2.5rem] xl:max-w-[600px]">
        <div className="w-full max-w-[390px]">
          <div className="mb-10 lg:hidden"><p className="text-sm font-semibold tracking-wide">Espaço Equilibre</p><p className="mt-1 text-xs text-black/45">Gestão de Pilates</p></div>
          <div className="mb-8"><p className="text-sm font-medium text-black/45">Área administrativa</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Bem-vindo de volta</h2><p className="mt-2 text-sm leading-6 text-black/50">Entre com seus dados para acessar o sistema.</p></div>
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <label className="block"><span className="mb-2 block text-sm font-medium">E-mail</span><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35" size={18}/><input type="email" placeholder="seu@email.com" className="h-12 w-full rounded-xl border border-black/10 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5" /></div></label>
            <label className="block"><span className="mb-2 block text-sm font-medium">Senha</span><div className="relative"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35" size={18}/><input type={showPassword ? "text" : "password"} placeholder="Digite sua senha" className="h-12 w-full rounded-xl border border-black/10 bg-white pl-11 pr-12 text-sm outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5" /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-black/35 hover:text-black" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
            <div className="flex items-center justify-end"><button type="button" className="text-xs font-medium text-black/55 hover:text-black">Esqueci minha senha</button></div>
            <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#111] text-sm font-medium text-white transition hover:bg-black/85">Entrar <ArrowRight size={17}/></button>
          </form>
          <p className="mt-8 text-center text-xs text-black/35">Acesso seguro e exclusivo para usuários autorizados.</p>
        </div>
      </section>
    </main>
  );
}
