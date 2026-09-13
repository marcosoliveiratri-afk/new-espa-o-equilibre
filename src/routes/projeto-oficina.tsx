import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { AuthGuard } from "@/components/AuthGuard";

export const Route = createFileRoute("/projeto-oficina")({ component: ProjetoOficina });

function ProjetoOficina() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f7f7f5]">
        <TopBar />
        <AppShell>
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 overflow-hidden rounded-3xl border border-black/5 bg-gradient-to-r from-[#1f2937] via-[#334155] to-[#0f766e] p-7 text-white shadow-[0_18px_40px_-24px_rgba(15,23,42,.7)]">
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/60">Novo módulo</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Projeto Oficina</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/70">
                Módulo em construção — as funcionalidades serão adicionadas em breve.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="font-semibold">Gestão de Projeto Oficina</h2>
              <p className="mt-2 text-sm leading-6 text-black/55">
                Área reservada para o módulo de Projeto Oficina. Aguarde as próximas atualizações.
              </p>
            </div>
          </div>
        </AppShell>
      </div>
    </AuthGuard>
  );
}
