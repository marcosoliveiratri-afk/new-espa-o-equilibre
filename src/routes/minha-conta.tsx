import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Save, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/minha-conta")({ component: MinhaConta });

function MinhaConta() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || ""));
  }, []);

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("A confirmação da senha não confere.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPassword("");
    setConfirmation("");
    setMessage("Senha alterada com sucesso.");
  }

  return (
    <AuthGuard>
      <div className="mx-auto max-w-3xl">
        <div className="mb-7">
          <h1 className="text-[30px] font-bold tracking-tight text-[#111827]">Minha conta</h1>
          <p className="mt-1 text-sm text-[#64748B]">Gerencie seus dados de acesso ao sistema.</p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white">
          <div className="flex items-center gap-3 border-b border-black/5 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF2FF]">
              <UserCircle size={20} color="#2563EB" />
            </div>
            <div>
              <h2 className="font-semibold text-[#111827]">Dados de acesso</h2>
              <p className="text-xs text-[#64748B]">{email || "Carregando..."}</p>
            </div>
          </div>

          <form onSubmit={changePassword} className="p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <KeyRound size={18} className="mt-0.5 shrink-0" />
              <p>Você pode trocar sua senha sempre que quiser. A senha deve ter pelo menos 8 caracteres.</p>
            </div>

            {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {message && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-[#111827]">Nova senha</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Mínimo de 8 caracteres"
                  className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/10"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-[#111827]">Confirmar nova senha</span>
                <input
                  type="password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Repita a nova senha"
                  className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/10"
                  required
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0057B8] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={17} />
                {saving ? "Salvando..." : "Alterar senha"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}
