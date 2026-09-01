import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { AuthGuard } from "@/components/AuthGuard";

export const Route = createFileRoute("/pilates")({ component: Pilates });

function Pilates() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isDashboard = pathname === "/pilates";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f7f7f5]">
        <TopBar />
        {isDashboard ? (
          <AppShell>
            <div className="mx-auto max-w-7xl">
              <div className="mb-8">
                <p className="text-sm font-medium text-black/45">Módulo</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Pilates</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
                  Gerencie a operação do seu estúdio de Pilates em um único lugar.
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                <h2 className="font-semibold">Gestão de Pilates</h2>
                <p className="mt-2 text-sm leading-6 text-black/55">
                  Área interna do módulo preparada para receber as funcionalidades do Pilates.
                </p>
              </div>
            </div>
          </AppShell>
        ) : (
          <Outlet />
        )}
      </div>
    </AuthGuard>
  );
}
