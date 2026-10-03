import { createFileRoute } from "@tanstack/react-router";
import { Hammer, LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { AuthGuard } from "@/components/AuthGuard";

export const Route = createFileRoute("/projeto-oficina")({
  component: ProjetoOficina,
  head: () => ({
    meta: [
      { title: "Projeto Oficina | Espaço Equilibre" },
      {
        name: "description",
        content: "Área de gestão do Projeto Oficina do Espaço Equilibre.",
      },
      { property: "og:title", content: "Projeto Oficina | Espaço Equilibre" },
      {
        property: "og:description",
        content: "Área de gestão do Projeto Oficina do Espaço Equilibre.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function OficinaShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="text-foreground">
      {menuOpen && (
        <div
          className="fixed inset-0 z-20 bg-foreground/20 lg:hidden"
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-16 z-30 w-64 border-r border-border bg-background transition-transform duration-200 lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Projeto Oficina</span>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Fechar menu"
              onClick={() => setMenuOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 px-3" aria-label="Navegação do Projeto Oficina">
            <a
              href="/projeto-oficina"
              className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3 text-sm font-medium text-foreground"
              aria-current="page"
            >
              <LayoutDashboard size={18} strokeWidth={1.8} />
              <span>Dashboard</span>
            </a>
          </nav>
        </div>
      </aside>

      <div className="lg:pl-64">
        <div className="flex h-14 items-center border-b border-border px-4 lg:hidden">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
          <span className="ml-3 text-sm font-semibold text-foreground">Projeto Oficina</span>
        </div>
        <main className="min-h-[calc(100vh-4rem)] bg-background p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function ProjetoOficina() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <TopBar />
        <OficinaShell>
          <div className="mx-auto max-w-7xl">
            <header className="mb-8">
              <h1 className="mt-1 text-[30px] font-bold leading-[1.2] text-foreground" style={{ letterSpacing: "-0.02em" }}>
                Projeto Oficina
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Módulo em construção — as funcionalidades serão adicionadas em breve.
              </p>
            </header>

            <section aria-labelledby="visao-geral-oficina">
              <h2 id="visao-geral-oficina" className="mb-4 text-lg font-bold text-foreground">
                Visão geral
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <article className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-muted text-foreground">
                    <Hammer size={18} strokeWidth={1.8} />
                  </div>
                  <div className="mt-4">
                    <p className="text-[13px] text-muted-foreground">Status do módulo</p>
                    <p className="mt-1 text-[26px] font-bold leading-none text-foreground">Em construção</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Área reservada para a gestão do Projeto Oficina.
                    </p>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </OficinaShell>
      </div>
    </AuthGuard>
  );
}
