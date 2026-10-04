import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Dumbbell, HeartPulse, Wrench } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { AuthGuard } from "@/components/AuthGuard";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-white text-[#1b1b1b]">
      <TopBar />
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-black/40">Painel de gestão</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Sistema de gestão Espaço Equilibre</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-black/50">Escolha um módulo para acessar a operação correspondente.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <Link to="/pilates" className="group flex min-h-[210px] flex-col rounded-3xl border border-black/10 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition duration-200 hover:-translate-y-1 hover:border-black/20 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/[0.04]"><Dumbbell size={21} className="text-black/70" /></div>
                <ArrowRight className="text-black/30 transition duration-200 group-hover:translate-x-1 group-hover:text-black/70" size={20} />
              </div>
              <div className="mt-auto pt-8">
                <h2 className="text-lg font-semibold">Pilates</h2>
                <p className="mt-2 text-sm leading-6 text-black/50">Tenha a operação do estúdio de Pilates em um só lugar.</p>
              </div>
            </Link>

            <Link to="/osteopatia" className="group flex min-h-[210px] flex-col rounded-3xl border border-black/10 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition duration-200 hover:-translate-y-1 hover:border-black/20 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/[0.04]"><HeartPulse size={21} className="text-black/70" /></div>
                <ArrowRight className="text-black/30 transition duration-200 group-hover:translate-x-1 group-hover:text-black/70" size={20} />
              </div>
              <div className="mt-auto pt-8">
                <h2 className="text-lg font-semibold">Osteopatia</h2>
                <p className="mt-2 text-sm leading-6 text-black/50">Gerencie a operação do atendimento de Osteopatia em um só lugar.</p>
              </div>
            </Link>

            <Link to="/projeto-oficina" className="group flex min-h-[210px] flex-col rounded-3xl border border-black/10 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition duration-200 hover:-translate-y-1 hover:border-black/20 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/[0.04]"><Wrench size={21} className="text-black/70" /></div>
                <ArrowRight className="text-black/30 transition duration-200 group-hover:translate-x-1 group-hover:text-black/70" size={20} />
              </div>
              <div className="mt-auto pt-8">
                <h2 className="text-lg font-semibold">Projeto Oficina</h2>
                <p className="mt-2 text-sm leading-6 text-black/50">Gerencie projetos e ordens de serviço da oficina.</p>
              </div>
            </Link>
          </div>
        </div>
</div>
      </main>
      </div>
    </AuthGuard>
  );
}
