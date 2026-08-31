import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export function AuthGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) { navigate({ to: "/login", replace: true }); return; }
      setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate({ to: "/login", replace: true });
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [navigate]);

  if (checking) return <div className="min-h-screen bg-[#f7f7f5]" />;
  return <>{children}</>;
}
