import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Dumbbell, Home, LogOut, Menu, Settings, Users, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { label: "Início", to: "/", icon: Home },
  { label: "Alunos", to: "/", icon: Users },
  { label: "Pilates", to: "/", icon: Dumbbell },
  { label: "Agenda", to: "/", icon: CalendarDays },
  { label: "Configurações", to: "/", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#1b1b1b]">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-black/10 bg-[#f7f7f5] text-[#1b1b1b] transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center justify-between border-b border-black/10 px-6">
            <div><p className="text-lg font-semibold tracking-wide">Espaço Equilibre</p><p className="text-xs text-black/45">Gestão de Pilates</p></div>
            <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={20} /></button>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {items.map(({ label, to, icon: Icon }) => (
              <Link key={label} to={to} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${pathname === to ? "bg-black/10 text-[#111]" : "text-black/55 hover:bg-black/5 hover:text-black"}`}>
                <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="border-t border-black/10 p-4"><button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-black/55 hover:bg-black/5 hover:text-black"><LogOut size={18} />Sair</button></div>
        </div>
      </aside>
      <div className="lg:pl-64"><header className="sticky top-0 z-30 flex h-16 items-center border-b border-black/10 bg-[#f7f7f5]/90 px-4 backdrop-blur lg:hidden"><button onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button><span className="ml-4 font-semibold">Espaço Equilibre</span></header><main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">{children}</main></div>
    </div>
  );
}
