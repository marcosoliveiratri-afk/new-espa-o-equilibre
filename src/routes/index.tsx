import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-black/45">Painel de gestão</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Bem-vindo ao Espaço Equilibre</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">Uma base simples, profissional e responsiva para centralizar a gestão do seu estúdio de Pilates.</p>
        </div>
        <section className="grid gap-4 md:grid-cols-3">
          {[{ title: "Alunos", text: "Cadastre e acompanhe seus alunos." }, { title: "Agenda", text: "Organize aulas e compromissos." }, { title: "Pilates", text: "Tenha a operação do estúdio em um só lugar." }].map((card) => (
            <div key={card.title} className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"><h2 className="font-semibold">{card.title}</h2><p className="mt-2 text-sm leading-6 text-black/55">{card.text}</p></div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
