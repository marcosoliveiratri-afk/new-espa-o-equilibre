import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/logo-equilibre.png.asset.json";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({
    meta: [
      { title: "Entrar — Espaço Equilibre" },
      { name: "description", content: "Faça login para acessar o sistema de gestão do Espaço Equilibre." },
      { property: "og:title", content: "Entrar — Espaço Equilibre" },
      { property: "og:description", content: "Faça login para acessar o sistema de gestão do Espaço Equilibre." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const TERRACOTTA = "#d98a7e";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/");
    });
  }, [navigate]);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage(""); setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("invalid login credentials")) {
        setError("E-mail ou senha incorretos. Verifique seus dados e tente novamente.");
      } else {
        setError(error.message);
      }
      return;
    }
    if (!data.session) { setError("Login realizado, mas a sessão não foi criada. Tente novamente."); return; }
    window.location.assign("/");
  }

  async function resetPassword() {
    setError(""); setMessage("");
    const normalizedEmail = email.trim();
    if (!normalizedEmail) { setError("Informe seu e-mail para recuperar a senha."); return; }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: window.location.origin + "/login",
    });
    setResetLoading(false);
    if (error) { setError(error.message); return; }
    setMessage("Enviamos as instruções de recuperação para o seu e-mail.");
  }

  return (
    <main className="flex min-h-screen bg-white text-[#1a1a1a]">
      {/* Lado esquerdo — marca */}
      <section className="hidden flex-1 flex-col items-center justify-center bg-[#f3f3f1] px-10 lg:flex">
        <div className="flex max-w-md flex-col items-center text-center">
          <img
            src={logoAsset.url}
            alt="Espaço Equilibre"
            width={160}
            height={160}
            className="h-40 w-40 object-contain"
          />
          <h1
            className="mt-10 text-5xl leading-tight text-[#1a1a1a]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontWeight: 500 }}
          >
            Espaço Equilibre
          </h1>
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.35em]" style={{ color: TERRACOTTA }}>
            Sistema de Gestão
          </p>
          <p className="mt-6 text-base leading-7 text-black/55">
            Gestão completa para seu estúdio de Pilates e Osteopatia.
          </p>
        </div>
      </section>

      {/* Lado direito — formulário */}
      <section className="flex w-full items-center justify-center px-6 py-12 lg:max-w-[52%]">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 flex flex-col items-center lg:hidden">
            <img src={logoAsset.url} alt="Espaço Equilibre" width={96} height={96} className="h-24 w-24 object-contain" />
            <p className="mt-4 text-2xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}>
              Espaço Equilibre
            </p>
          </div>

          <h2 className="text-3xl font-semibold tracking-tight">Bem-vindo de volta!</h2>
          <p className="mt-2 text-sm text-black/50">Faça login para acessar o sistema</p>

          <form className="mt-8 space-y-5" onSubmit={signIn}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">E-mail</span>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35" size={18} />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className="h-12 w-full rounded-xl border border-black/15 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#d98a7e] focus:ring-2 focus:ring-[#d98a7e]/15"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Senha</span>
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35" size={18} />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-12 w-full rounded-xl border border-black/15 bg-white pl-11 pr-12 text-sm outline-none transition focus:border-[#d98a7e] focus:ring-2 focus:ring-[#d98a7e]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-black/35 hover:text-black"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {error && <p className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700">{error}</p>}
            {message && <p className="rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-2 text-sm text-green-700">{message}</p>}

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-black/60">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-black/25 accent-[#d98a7e]"
                />
                Lembrar-me
              </label>
              <button
                disabled={resetLoading}
                type="button"
                onClick={resetPassword}
                className="text-sm font-medium disabled:opacity-50"
                style={{ color: TERRACOTTA }}
              >
                {resetLoading ? "Enviando..." : "Esqueci minha senha"}
              </button>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="h-12 w-full rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: TERRACOTTA }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-black/50">
            Não tem uma conta?{" "}
            <span className="font-medium" style={{ color: TERRACOTTA }}>Fale com o administrador</span>
          </p>
        </div>
      </section>
    </main>
  );
}
