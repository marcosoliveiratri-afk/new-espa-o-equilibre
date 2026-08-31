import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-black/45">Painel de gestão</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Pilates</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">Tenha a operação do estúdio de Pilates em um só lugar.</p>
        </div>
      </div>
    </AppShell>
  );
}
