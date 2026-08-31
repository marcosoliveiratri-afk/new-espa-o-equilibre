import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Dumbbell } from "lucide-react";
import { TopBar } from "@/components/TopBar";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#1b1b1b]">
      <TopBar />
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="text-sm font-medium text-black/45">Painel de gestão</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Sistema de gestão Espaço Equilibre</h1>
            <p className="mt-2 text-sm leading-6 text-black/55">Acesse os módulos</p>
          </div>

          <Link
            to="/pilates"
            className="group block rounded-2xl border border-black/10 bg-white p-6 transition hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/5">
                <Dumbbell size={22} strokeWidth={1.8} />
              </div>
              <ArrowRight className="text-black/35 transition group-hover:translate-x-1 group-hover:text-black/70" size={20} />
            </div>
            <h2 className="mt-5 font-semibold">Pilates</h2>
            <p className="mt-2 text-sm leading-6 text-black/55">Tenha a operação do estúdio de Pilates em um só lugar.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
