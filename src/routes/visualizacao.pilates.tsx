import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";

export const Route = createFileRoute("/visualizacao/pilates")({ component: VisualizacaoPilates });

function VisualizacaoPilates() {
  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <TopBar />
      <AppShell>
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-sm font-medium text-black/45">Modo de visualização</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Pilates</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">Navegação sem autenticação para visualização das páginas.</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="font-semibold">Gestão de Pilates</h2>
            <p className="mt-2 text-sm leading-6 text-black/55">Área de visualização do módulo preparada para receber as funcionalidades do Pilates.</p>
          </div>
        </div>
      </AppShell>
    </div>
  );
}
