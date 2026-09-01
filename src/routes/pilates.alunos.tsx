import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { AuthGuard } from "@/components/AuthGuard";
import { Filter, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

type Student = {
  initials: string;
  name: string;
  phone: string;
  plan: string;
  teacher: string;
  due: string;
  active: boolean;
  tuition: "Em dia" | "Próxima do vencimento" | "Vencida";
  contract: "Regular" | "Vencendo";
  assessment: "Em dia" | "Vencida";
  financial: "Regular" | "Pendente";
};

const students: Student[] = [
  { initials: "AM", name: "Ana Martins", phone: "(11) 99999-1201", plan: "Pilates 2x semana", teacher: "Carla Souza", due: "12/09/2026", active: true, tuition: "Em dia", contract: "Regular", assessment: "Em dia", financial: "Regular" },
  { initials: "BC", name: "Bruno Costa", phone: "(11) 98888-3421", plan: "Pilates 3x semana", teacher: "Mariana Lima", due: "04/09/2026", active: true, tuition: "Próxima do vencimento", contract: "Vencendo", assessment: "Em dia", financial: "Regular" },
  { initials: "CF", name: "Camila Ferreira", phone: "(11) 97777-5632", plan: "Pilates 2x semana", teacher: "Carla Souza", due: "28/08/2026", active: true, tuition: "Vencida", contract: "Regular", assessment: "Vencida", financial: "Pendente" },
  { initials: "DP", name: "Diego Pereira", phone: "(11) 96666-7810", plan: "Pilates 1x semana", teacher: "Rafael Alves", due: "18/09/2026", active: false, tuition: "Em dia", contract: "Regular", assessment: "Em dia", financial: "Regular" },
];

const statusClass = (value: string) => {
  if (["Vencida", "Vencendo", "Pendente"].includes(value)) return "bg-red-50 text-red-700 ring-red-600/10";
  if (value === "Próxima do vencimento") return "bg-amber-50 text-amber-700 ring-amber-600/10";
  return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
};

export const Route = createFileRoute("/pilates/alunos")({ component: Alunos });

function Alunos() {
  const [search, setSearch] = useState("");
  const [activity, setActivity] = useState("Todos");
  const [alertFilter, setAlertFilter] = useState("Todos");
  const [teacher, setTeacher] = useState("Todos");
  const [plan, setPlan] = useState("Todos");
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => students.filter((student) => {
    const term = search.toLowerCase();
    const matchesSearch = !term || student.name.toLowerCase().includes(term) || student.phone.includes(term);
    const matchesActivity = activity === "Todos" || (activity === "Ativos" ? student.active : !student.active);
    const matchesTeacher = teacher === "Todos" || student.teacher === teacher;
    const matchesPlan = plan === "Todos" || student.plan === plan;
    const matchesAlert = alertFilter === "Todos"
      || (alertFilter === "Mensalidade vencida" && student.tuition === "Vencida")
      || (alertFilter === "Próxima do vencimento" && student.tuition === "Próxima do vencimento")
      || (alertFilter === "Contrato vencendo" && student.contract === "Vencendo")
      || (alertFilter === "Avaliação vencida" && student.assessment === "Vencida");
    return matchesSearch && matchesActivity && matchesTeacher && matchesPlan && matchesAlert;
  }), [search, activity, alertFilter, teacher, plan]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f7f7f5]">
        <TopBar />
        <AppShell>
          <div className="w-full max-w-none">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-black/45">Pilates</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight">Cadastro de Alunos</h1>
                <p className="mt-2 text-sm text-black/55">Consulte, filtre e acompanhe a situação dos alunos.</p>
              </div>
              <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1b1b1b] px-4 py-3 text-sm font-medium text-white hover:bg-black">
                <Plus size={18} /> Novo aluno
              </button>
            </div>

            <div className="w-full">
              <div className="border-y border-black/10 py-4">
                <div className="flex flex-col gap-3 lg:flex-row">
                  <label className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" size={18} />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar aluno por nome ou telefone..." className="w-full rounded-xl border border-black/10 bg-[#fafafa] py-3 pl-10 pr-4 text-sm outline-none focus:border-black/30" />
                  </label>
                  <div className="flex items-center gap-2 text-sm text-black/45"><Filter size={16} /> Filtros</div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  <select value={activity} onChange={(e) => setActivity(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm"><option>Todos</option><option>Ativos</option><option>Inativos</option></select>
                  <select value={alertFilter} onChange={(e) => setAlertFilter(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm"><option>Todos</option><option>Mensalidade vencida</option><option>Próxima do vencimento</option><option>Contrato vencendo</option><option>Avaliação vencida</option></select>
                  <select value={teacher} onChange={(e) => setTeacher(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm"><option>Todos</option><option>Carla Souza</option><option>Mariana Lima</option><option>Rafael Alves</option></select>
                  <select value={plan} onChange={(e) => setPlan(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm"><option>Todos</option><option>Pilates 1x semana</option><option>Pilates 2x semana</option><option>Pilates 3x semana</option></select>
                  <div className="flex items-center px-2 text-sm text-black/45">{filtered.length} aluno(s) encontrado(s)</div>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[1400px] text-left text-sm">
                  <thead className="bg-black/[0.025] text-xs uppercase tracking-wide text-black/45">
                    <tr>{["Foto","Nome","Telefone","Plano atual","Professor responsável","Vencimento do plano","Status do plano","Status do contrato","Status da avaliação física","Status financeiro"].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3 font-medium">{heading}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {filtered.map((student) => (
                      <tr key={student.name} className="hover:bg-black/[0.015]">
                        <td className="px-4 py-4"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/10 text-xs font-semibold">{student.initials}</div></td>
                        <td className="px-4 py-4 font-medium"><Link to="/pilates/alunos/$alunoId" params={{ alunoId: student.name.toLowerCase().replace(/ /g, "-") }} className="hover:underline">{student.name}</Link></td>
                        <td className="px-4 py-4 text-black/60">{student.phone}</td>
                        <td className="px-4 py-4">{student.plan}</td>
                        <td className="px-4 py-4">{student.teacher}</td>
                        <td className="px-4 py-4">{student.due}</td>
                        <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${student.active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/10" : "bg-black/5 text-black/55 ring-black/10"}`}>{student.active ? "Ativo" : "Inativo"}</span></td>
                        <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClass(student.contract)}`}>{student.contract}</span></td>
                        <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClass(student.assessment)}`}>{student.assessment}</span></td>
                        <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClass(student.financial === "Regular" ? "Em dia" : student.financial)}`}>{student.financial}</span></td>
                      </tr>
                    ))}
                    {!filtered.length && <tr><td colSpan={10} className="px-4 py-12 text-center text-black/45">Nenhum aluno encontrado para os filtros selecionados.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {showForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
                  <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Novo aluno</h2><p className="mt-1 text-sm text-black/55">Preencha os dados iniciais para cadastrar o aluno.</p></div><button onClick={() => setShowForm(false)} className="rounded-lg px-2 py-1 text-black/50 hover:bg-black/5">Fechar</button></div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <input placeholder="Nome completo" className="rounded-xl border border-black/10 px-3 py-3 text-sm" />
                    <input placeholder="Telefone" className="rounded-xl border border-black/10 px-3 py-3 text-sm" />
                    <select className="rounded-xl border border-black/10 px-3 py-3 text-sm"><option>Selecione o plano</option><option>Pilates 1x semana</option><option>Pilates 2x semana</option><option>Pilates 3x semana</option></select>
                    <select className="rounded-xl border border-black/10 px-3 py-3 text-sm"><option>Selecione o professor</option><option>Carla Souza</option><option>Mariana Lima</option><option>Rafael Alves</option></select>
                  </div>
                  <div className="mt-6 flex justify-end gap-3"><button onClick={() => setShowForm(false)} className="rounded-xl border border-black/10 px-4 py-2.5 text-sm">Cancelar</button><button className="rounded-xl bg-[#1b1b1b] px-4 py-2.5 text-sm font-medium text-white">Salvar aluno</button></div>
                </div>
              </div>
            )}
          </div>
        </AppShell>
      </div>
    </AuthGuard>
  );
}
