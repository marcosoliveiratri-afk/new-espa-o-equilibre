import { Link, useRouterState } from "@tanstack/react-router";
import { Dumbbell, Menu, X } from "lucide-react";
import { useState } from "react";

const items = [
  { label: "Pilates", to: "/pilates", icon: Dumbbell },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="text-[#1b1b1b]">
      <aside className={`fixed top-16 bottom-0 left-0 z-30 w-64 border-r border-black/10 bg-[#f7f7f5] transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <nav className="flex-1 space-y-1 p-4">
            {items.map(({ label, to, icon: Icon }) => (
              <Link key={label} to={to} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${pathname === to ? "bg-black/10 text-[#111]" : "text-black/55 hover:bg-black/5 hover:text-black"}`}>
                <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <div className="lg:pl-64">
        <div className="flex h-14 items-center border-b border-black/10 px-4 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button>
          <button className="ml-auto" onClick={() => setOpen(false)} aria-label="Fechar menu"><X className="hidden" size={20} /></button>
        </div>
        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
