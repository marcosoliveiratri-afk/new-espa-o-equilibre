import { Link, useLocation } from "@tanstack/react-router";
import { Bell, CalendarCheck2, ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, LogOut, ReceiptText, UsersRound, UserRoundCog, WalletCards } from "lucide-react";
import { useState } from "react";

const items=[
 {to:"/projeto-oficina",label:"Dashboard",icon:LayoutDashboard,exact:true},
 {to:"/projeto-oficina/aulas",label:"Aulas e Turmas",icon:CalendarCheck2},
 {to:"/projeto-oficina/alunos",label:"Alunos",icon:UsersRound},
 {to:"/projeto-oficina/planos",label:"Planos",icon:ClipboardList},
 {to:"/projeto-oficina/professores",label:"Professores",icon:UserRoundCog},
 {to:"/projeto-oficina/financeiro",label:"Financeiro",icon:WalletCards},
 {to:"/projeto-oficina/alertas",label:"Alertas",icon:Bell},
 {to:"/projeto-oficina/fechamentos",label:"Fechamentos",icon:ReceiptText},
];

export function OficinaSidebar(){
 const [collapsed,setCollapsed]=useState(false);
 const location=useLocation();
 const active=(to:string,exact?:boolean)=>exact?location.pathname===to:location.pathname===to||location.pathname.startsWith(to+"/");
 return <aside className={`sticky top-0 z-40 hidden h-screen shrink-0 border-r border-black/10 bg-white transition-[width] duration-200 lg:block ${collapsed?"w-[76px]":"w-[248px]"}`}>
  <div className="flex h-full flex-col">
   <div className={`flex h-[72px] items-center border-b border-black/10 ${collapsed?"justify-center":"justify-between px-5"}`}>
    {!collapsed&&<div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-black/40">Espaço Equilibre</p><h2 className="mt-0.5 text-lg font-bold text-black/85">Projeto Oficina</h2></div>}
    <button onClick={()=>setCollapsed(v=>!v)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-black/55 hover:bg-black/[.03]" title={collapsed?"Expandir menu":"Recolher menu"}>{collapsed?<ChevronRight size={17}/>:<ChevronLeft size={17}/>}</button>
   </div>
   <nav className="flex-1 space-y-1 overflow-y-auto p-3">
    {items.map(({to,label,icon:Icon,exact})=>{const isActive=active(to,exact);return <Link key={to} to={to} className={`group flex items-center rounded-xl transition ${collapsed?"justify-center px-2 py-3":"gap-3 px-3 py-2.5"} ${isActive?"bg-black/[.06] text-black":"text-black/55 hover:bg-black/[.035] hover:text-black"}`} title={collapsed?label:undefined}>
      <Icon size={18} strokeWidth={isActive?2.2:1.8}/>{!collapsed&&<span className={`text-sm ${isActive?"font-semibold":"font-medium"}`}>{label}</span>}
    </Link>})}
   </nav>
   <div className="border-t border-black/10 p-3">
    <Link to="/projeto-oficina" className={`flex items-center rounded-xl text-black/50 hover:bg-black/[.035] hover:text-black ${collapsed?"justify-center px-2 py-3":"gap-3 px-3 py-2.5"}`} title={collapsed?"Voltar ao início":"Voltar ao início"}><LogOut size={18}/>{!collapsed&&<span className="text-sm font-medium">Início da Oficina</span>}</Link>
   </div>
  </div>
 </aside>
}