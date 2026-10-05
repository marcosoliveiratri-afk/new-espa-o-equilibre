import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, UserPlus, UserRound, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";

type ManagedUser = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: "admin" | "staff";
  active: boolean;
};

export const Route = createFileRoute("/usuarios")({ component: Usuarios });

function Usuarios() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "staff" as "admin" | "staff" });

  async function load() {
    setLoading(true);
    setError("");
    const { data, error: fnError } = await supabase.functions.invoke("manage-users", { method: "GET" });
    if (fnError) setError(fnError.message);
    else setUsers(data?.users || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createUser() {
    setError("");
    setMessage("");
    setSaving(true);
    const { data, error: fnError } = await supabase.functions.invoke("manage-users", {
      method: "POST",
      body: form,
    });
    setSaving(false);
    if (fnError || data?.error) {
      setError(data?.error || fnError?.message || "Não foi possível criar o usuário.");
      return;
    }
    setMessage("Usuário criado com sucesso.");
    setForm({ email: "", password: "", role: "staff" });
    setShowForm(false);
    load();
  }

  async function updateUser(id: string, changes: Partial<ManagedUser>) {
    setError("");
    setMessage("");
    const { data, error: fnError } = await supabase.functions.invoke("manage-users", {
      method: "PATCH",
      body: { id, ...changes },
    });
    if (fnError || data?.error) {
      setError(data?.error || fnError?.message || "Não foi possível atualizar o usuário.");
      return;
    }
    setMessage("Usuário atualizado.");
    load();
  }

  const fmt = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "Nunca";

  return (
    <AuthGuard>
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-bold tracking-tight text-[#111827]">Usuários</h1>
            <p className="mt-1 text-sm text-[#64748B]">Controle quem pode acessar o sistema e qual nível de acesso possui.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#475569]">
              <RefreshCw size={16} /> Atualizar
            </button>
            <button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#0057B8] px-4 py-2.5 text-sm font-semibold text-white">
              <UserPlus size={17} /> Novo usuário
            </button>
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
          <div className="border-b border-black/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF2FF]"><ShieldCheck size={18} color="#2563EB" /></div>
              <div>
                <h2 className="font-semibold text-[#111827]">Contas de acesso</h2>
                <p className="text-xs text-[#64748B]">{users.length} usuário(s) cadastrado(s)</p>
              </div>
            </div>
          </div>

          {loading ? <div className="px-5 py-12 text-center text-sm text-[#94A3B8]">Carregando usuários...</div> :
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#64748B]">
                <tr><th className="px-5 py-3">Usuário</th><th className="px-5 py-3">Perfil</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Último acesso</th><th className="px-5 py-3">Criado em</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-black/5">
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2F2F7]"><UserRound size={17} color="#64748B" /></div><span className="font-medium text-[#111827]">{u.email}</span></div></td>
                    <td className="px-5 py-4"><select value={u.role} onChange={(e) => updateUser(u.id, { role: e.target.value as "admin" | "staff" })} className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium"><option value="staff">Staff</option><option value="admin">Administrador</option></select></td>
                    <td className="px-5 py-4"><button type="button" onClick={() => updateUser(u.id, { active: !u.active })} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${u.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{u.active ? "Ativo" : "Inativo"}</button></td>
                    <td className="px-5 py-4 text-[#64748B]">{fmt(u.last_sign_in_at)}</td>
                    <td className="px-5 py-4 text-[#64748B]">{fmt(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
        </div>

        {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-[#111827]">Novo usuário</h2>
            <p className="mt-1 text-sm text-[#64748B]">Crie uma conta para acesso ao sistema.</p>
            <div className="mt-5 space-y-4">
              <label className="block"><span className="mb-1.5 block text-sm font-medium">E-mail</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="usuario@equilibre.com" className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm" /></label>
              <label className="block"><span className="mb-1.5 block text-sm font-medium">Senha inicial</span><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo de 8 caracteres" className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm" /></label>
              <label className="block"><span className="mb-1.5 block text-sm font-medium">Perfil</span><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "staff" })} className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm"><option value="staff">Staff — acesso operacional</option><option value="admin">Administrador — gerenciamento completo</option></select></label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-black/10 px-4 py-2.5 text-sm">Cancelar</button><button type="button" disabled={saving} onClick={createUser} className="rounded-xl bg-[#0057B8] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Criando..." : "Criar usuário"}</button></div>
          </div>
        </div>}
      </div>
    </AuthGuard>
  );
}
