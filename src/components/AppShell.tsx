import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, LayoutDashboard, Menu, Settings, Users, FlaskConical, ReceiptText, BellRing, X, WalletCards } from "lucide-react";
import { useState } from "react";

const pilatesItems = [
  { label: "Alunos", to: "/pilates/alunos", icon: Users },
  { label: "Aulas experimentais", to: "/pilates/aulas-experimentais", icon: FlaskConical },
  { label: "Central de alertas", to: "/pilates/alertas", icon: BellRing },
  { label: "Fechamentos", to: "/pilates/fechamentos", icon: ReceiptText },
  { label: "Fluxo de caixa", to: "/pilates/fluxo-caixa", icon: WalletCards },
  { label: "Dashboard", to: "/pilates", icon: LayoutDashboard },
  { label: "Configurações", to: "/pilates/configuracoes", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="text-[#1b1b1b]">
      <aside className={`fixed top-16 bottom-0 left-0 z-30 border-r border-black/10 bg-[#f7f7f5] transition-[width,transform] duration-200 lg:translate-x-0 ${collapsed ? "w-20" : "w-64"} ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-4">
            {!collapsed && <span className="text-xs font-semibold uppercase tracking-[0.12em] text-black/40">Pilates</span>}
            <button onClick={() => setCollapsed((value) => !value)} className="hidden rounded-lg p-2 text-black/55 hover:bg-black/5 hover:text-black lg:inline-flex" aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"} title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}>
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {pilatesItems.map(({ label, to, icon: Icon }) => {
              const active = to === "/pilates" ? pathname === "/pilates" : pathname.startsWith(to);
              return (
                <Link key={label} to={to} onClick={() => setOpen(false)} title={collapsed ? label : undefined} className={`flex items-center rounded-xl py-3 text-sm transition ${collapsed ? "justify-center px-2" : "gap-3 px-4"} ${active ? "bg-black/10 text-[#111]" : "text-black/55 hover:bg-black/5 hover:text-black"}`}>
                  <Icon size={18} strokeWidth={1.8} />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <div className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <div className="flex h-14 items-center border-b border-black/10 px-4 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button>
          <button className="ml-auto" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={20} /></button>
        </div>
        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
