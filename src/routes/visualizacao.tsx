import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { TopBar } from "@/components/TopBar";

export const Route = createFileRoute("/visualizacao")({ component: Visualizacao });

function Visualizacao() {
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#1b1b1b]">
      <TopBar />
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <p className="text-sm font-medium text-black/45">Modo de visualização</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Sistema de gestão Espaço Equilibre</h1>
            <p className="mt-2 text-sm leading-6 text-black/55">Navegue pelas páginas sem autenticação.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link to="/visualizacao/pilates" className="group block rounded-2xl border border-black/10 bg-white p-6 transition hover:-translate-y-0.5">
              <div className="flex justify-end"><ArrowRight className="text-black/35 transition group-hover:translate-x-1 group-hover:text-black/70" size={20} /></div>
              <h2 className="mt-2 font-semibold">Pilates</h2>
              <p className="mt-2 text-sm leading-6 text-black/55">Visualize a área do módulo de Pilates.</p>
            </Link>
            <Link to="/visualizacao/osteopatia" className="group block rounded-2xl border border-black/10 bg-white p-6 transition hover:-translate-y-0.5">
              <div className="flex justify-end"><ArrowRight className="text-black/35 transition group-hover:translate-x-1 group-hover:text-black/70" size={20} /></div>
              <h2 className="mt-2 font-semibold">Osteopatia</h2>
              <p className="mt-2 text-sm leading-6 text-black/55">Visualize a área do módulo de Osteopatia.</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
