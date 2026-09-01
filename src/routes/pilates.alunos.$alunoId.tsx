import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, ExternalLink, RotateCcw } from "lucide-react";
import { useState } from "react";

const tabs = ["Informações pessoais", "Plano", "Contrato", "Avaliação física", "Financeiro", "Histórico"] as const;
type Tab = typeof tabs[number];

const badge = (label: string, tone: "green" | "yellow" | "red" | "gray" = "gray") => {
  const styles = { green: "bg-emerald-50 text-emerald-700 ring-emerald-600/10", yellow: "bg-amber-50 text-amber-700 ring-amber-600/10", red: "bg-red-50 text-red-700 ring-red-600/10", gray: "bg-black/5 text-black/60 ring-black/10" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${styles[tone]}`}>{label}</span>;
};

export const Route = createFileRoute("/pilates/alunos/$alunoId")({ component: PerfilAluno });

function PerfilAluno() {
  const [tab, setTab] = useState<Tab>("Informações pessoais");
  const { alunoId } = Route.useParams();

  const student = { name: alunoId === "bruno-costa" ? "Bruno Costa" : alunoId === "camila-ferreira" ? "Camila Ferreira" : "Ana Martins", initials: alunoId === "bruno-costa" ? "BC" : alunoId === "camila-ferreira" ? "CF" : "AM" };

  return (
    <div className="mx-auto max-w-7xl">
            <Link to="/pilates/alunos" className="mb-5 inline-flex items-center gap-2 text-sm text-black/55 hover:text-black"><ArrowLeft size={17} /> Voltar para alunos</Link>

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/10 text-lg font-semibold">{student.initials}</div>
                <div className="flex-1"><p className="text-sm text-black/45">Perfil do aluno</p><h1 className="text-2xl font-semibold">{student.name}</h1><div className="mt-2">{badge("Ativo", "green")}</div></div>
              </div>
              <div className="mt-6 flex gap-2 overflow-x-auto border-t border-black/10 pt-4">
                {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition ${tab === item ? "bg-black text-white" : "text-black/55 hover:bg-black/5 hover:text-black"}`}>{item}</button>)}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
              {tab === "Informações pessoais" && <PersonalInfo />}
              {tab === "Plano" && <Plan />}
              {tab === "Contrato" && <Contract />}
              {tab === "Avaliação física" && <Assessment />}
              {tab === "Financeiro" && <Financial />}
              {tab === "Histórico" && <History />}
            </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return <div className="mb-6"><h2 className="text-xl font-semibold">{title}</h2>{subtitle && <p className="mt-1 text-sm text-black/55">{subtitle}</p>}</div>;
}
function Field({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-medium uppercase tracking-wide text-black/40">{label}</dt><dd className="mt-1 text-sm font-medium text-black/80">{value}</dd></div>; }

function PersonalInfo() {
  return <><SectionTitle title="Informações pessoais" subtitle="Dados cadastrais e formas de contato do aluno." /><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"><Field label="Nome" value="Ana Martins" /><Field label="Data de nascimento" value="18/05/1991" /><Field label="Idade" value="35 anos" /><Field label="Telefone" value="(11) 99999-1201" /><div><dt className="text-xs font-medium uppercase tracking-wide text-black/40">WhatsApp</dt><dd className="mt-1"><a href="https://wa.me/5511999991201" target="_blank" rel="noreferrer" className="text-sm font-medium underline">Abrir conversa no WhatsApp</a></dd></div><Field label="E-mail" value="ana.martins@email.com" /><Field label="CPF" value="***.***.***-**" /><Field label="Endereço" value="Rua das Flores, 120 — Bragança Paulista/SP" /><Field label="Observações" value="Preferência por aulas no período da manhã." /></div></>;
}
function Plan() {
  return <><SectionTitle title="Plano atual" /><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"><Field label="Plano" value="Mensal" /><Field label="Professor responsável" value="Carla Souza" /><Field label="Valor mensal" value="R$ 320,00" /><Field label="Data de início" value="12/01/2026" /><Field label="Vencimento" value="12/09/2026" /><div><dt className="text-xs font-medium uppercase tracking-wide text-black/40">Status</dt><dd className="mt-1">{badge("Ativo", "green")}</dd></div></div></>;
}
function Contract() {
  return <><SectionTitle title="Contrato" subtitle="Acompanhe a vigência e os documentos vinculados ao aluno." /><div className="grid gap-6 sm:grid-cols-3"><div><dt className="text-xs font-medium uppercase tracking-wide text-black/40">Status</dt><dd className="mt-1">{badge("Regular", "green")}</dd></div><Field label="Vigência" value="12/01/2026 a 11/01/2027" /><Field label="Anexo" value="Contrato_ana_martins.pdf" /></div><div className="mt-7 flex flex-wrap gap-3"><button className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium"><ExternalLink size={17} /> Visualizar contrato</button><button className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium"><Download size={17} /> Baixar anexo</button><button className="inline-flex items-center gap-2 rounded-xl bg-[#1b1b1b] px-4 py-2.5 text-sm font-medium text-white"><RotateCcw size={17} /> Renovar contrato</button></div></>;
}
function Assessment() {
  return <><SectionTitle title="Avaliação física" /><div className="grid gap-6 sm:grid-cols-3"><Field label="Última avaliação" value="15/06/2026" /><Field label="Próxima avaliação" value="15/12/2026" /><div><dt className="text-xs font-medium uppercase tracking-wide text-black/40">Status</dt><dd className="mt-1">{badge("🟢 Em dia", "green")}</dd></div></div><div className="mt-8"><h3 className="font-semibold">Histórico</h3><div className="mt-3 space-y-3"><div className="rounded-xl border border-black/10 p-4 text-sm"><strong>15/06/2026</strong><p className="mt-1 text-black/55">Avaliação periódica realizada.</p></div><div className="rounded-xl border border-black/10 p-4 text-sm"><strong>12/01/2026</strong><p className="mt-1 text-black/55">Avaliação inicial cadastrada.</p></div></div></div></>;
}
function Financial() {
  const rows = [["12/09/2026","R$ 320,00","Em aberto","—","—","Clínica"],["12/08/2026","R$ 320,00","Pago","12/08/2026","Pix","Clínica"],["12/07/2026","R$ 320,00","Pago","11/07/2026","Cartão","Professor"]];
  return <><SectionTitle title="Financeiro" subtitle="Histórico de mensalidades e recebimentos." /><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-black/10 text-xs uppercase text-black/40"><tr>{["Vencimento","Valor","Status","Data do pagamento","Forma de pagamento","Destino"].map(x=><th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody className="divide-y divide-black/5">{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j} className="px-3 py-4">{j===2 ? badge(cell, cell==="Pago" ? "green" : "yellow") : cell}</td>)}</tr>)}</tbody></table></div></>;
}
function History() {
  return <><SectionTitle title="Histórico de alterações" subtitle="Audit log das edições realizadas no cadastro do aluno." /><div className="space-y-4 border-l border-black/10 pl-5"><div><p className="text-sm font-medium">Plano atualizado</p><p className="text-sm text-black/50">31/08/2026 às 14:32 · por Administrador</p><p className="mt-1 text-sm text-black/60">Plano alterado para Mensal.</p></div><div><p className="text-sm font-medium">Telefone atualizado</p><p className="text-sm text-black/50">20/08/2026 às 09:15 · por Recepção</p><p className="mt-1 text-sm text-black/60">Número de contato do aluno atualizado.</p></div><div><p className="text-sm font-medium">Cadastro criado</p><p className="text-sm text-black/50">12/01/2026 às 10:00 · por Administrador</p></div></div></>;
}
