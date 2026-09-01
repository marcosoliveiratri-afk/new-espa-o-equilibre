import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function TopBar() {
  const [user, setUser] = useState<{ name: string; email: string }>({ name: "Usuário", email: "" });

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted || !data.user) return;
      const name =
        data.user.user_metadata?.['full_name'] ||
        data.user.user_metadata?.['name'] ||
        data.user.email?.split("@")[0] ||
        "Usuário";
      setUser({ name, email: data.user.email || "" });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user;
      if (!currentUser) {
        setUser({ name: "Usuário", email: "" });
        return;
      }
      const name =
        currentUser.user_metadata?.['full_name'] ||
        currentUser.user_metadata?.['name'] ||
        currentUser.email?.split("@")[0] ||
        "Usuário";
      setUser({ name, email: currentUser.email || "" });
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-black/10 bg-[#f7f7f5]/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div>
          <p className="font-semibold tracking-wide">Espaço Equilibre</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-black/45">{user.email}</p>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black/65 transition hover:bg-black/5 hover:text-black"
            aria-label="Sair"
          >
            <LogOut size={17} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
