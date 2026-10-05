import { Link, useLocation } from "@tanstack/react-router";
import { Bell, CalendarCheck2, ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, LogOut, Menu, ReceiptText, UsersRound, UserRoundCog, WalletCards, X } from "lucide-react";
import { useState } from "react";

const items: { to: string; label: string; icon: typeof Menu; exact?: boolean }[] = [
  { to: "/projeto-oficina", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/projeto-oficina/aulas", label: "Aulas", icon: CalendarCheck2 },
  { to: "/projeto-oficina/turmas", label: "Turmas", icon: CalendarCheck2 },
  { to: "/projeto-oficina/alunos", label: "Alunos", icon: UsersRound },
  { to: "/projeto-oficina/planos", label: "Planos", icon: ClipboardList },
  { to: "/projeto-oficina/professores", label: "Professores", icon: UserRoundCog },
  { to: "/projeto-oficina/financeiro", label: "Financeiro", icon: WalletCards },
  { to: "/projeto-oficina/alertas", label: "Alertas", icon: Bell },
  { to: "/projeto-oficina/fechamentos", label: "Fechamentos", icon: ReceiptText },
];

export function OficinaSidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const active = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + "/");

  const renderItems = (mobile = false) => items.map(({ to, label, icon: Icon, exact }) => {
    const isActive = active(to, exact);
    return (
      <Link key={to} to={to as any} onClick={() => mobile && setMobileOpen(false)}
        className={`group flex items-center rounded-xl transition ${mobile ? "gap-3 px-4 py-3" : collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5"} ${isActive ? "bg-black/[.06] text-black" : "text-black/55 hover:bg-black/[.035] hover:text-black"}`}
        title={!mobile && collapsed ? label : undefined}>
        <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
        {(mobile || !collapsed) && <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>{label}</span>}
      </Link>
    );
  });

  return (
    <>
      <div className="sticky top-16 z-30 flex h-14 items-center border-b border-black/10 bg-white px-4 lg:hidden">
        <button type="button" onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-black/65" aria-label="Abrir menu da Oficina"><Menu size={20} /></button>
        <div className="ml-3">
          <p className="text-[9px] font-semibold uppercase tracking-[.14em] text-black/40">Espaço Equilibre</p>
          <p className="text-sm font-bold text-black/85">Projeto Oficina</p>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" />
          <aside className="relative flex h-full w-[290px] max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-black/10 px-5">
              <div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-black/40">Espaço Equilibre</p><h2 className="text-lg font-bold text-black/85">Projeto Oficina</h2></div>
              <button type="button" onClick={() => setMobileOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-black/55" aria-label="Fechar menu da Oficina"><X size={18} /></button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">{renderItems(true)}</nav>
            <div className="border-t border-black/10 p-3"><Link to="/projeto-oficina" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-black/50 hover:bg-black/[.035] hover:text-black"><LogOut size={18} /><span>Início da Oficina</span></Link></div>
          </aside>
        </div>
      )}

      <aside className={`sticky top-16 z-30 hidden h-[calc(100vh-4rem)] shrink-0 border-r border-black/10 bg-white transition-[width] duration-200 lg:block ${collapsed ? "w-[76px]" : "w-[248px]"}`}>
        <div className="flex h-full flex-col">
          <div className={`flex h-[72px] items-center border-b border-black/10 ${collapsed ? "justify-center" : "justify-between px-5"}`}>
            {!collapsed && <div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-black/40">Espaço Equilibre</p><h2 className="mt-0.5 text-lg font-bold text-black/85">Projeto Oficina</h2></div>}
            <button type="button" onClick={() => setCollapsed(value => !value)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white text-black/55 hover:bg-gray-50" title={collapsed ? "Expandir menu" : "Recolher menu"} aria-label={collapsed ? "Expandir menu" : "Recolher menu"}>{collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-3">{renderItems()}</nav>
          <div className="border-t border-black/10 p-3"><Link to="/projeto-oficina" className={`flex items-center rounded-xl text-black/50 hover:bg-black/[.035] hover:text-black ${collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5"}`} title={collapsed ? "Início da Oficina" : undefined}><LogOut size={18} />{!collapsed && <span className="text-sm font-medium">Início da Oficina</span>}</Link></div>
        </div>
      </aside>
    </>
  );
}
