import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Não autorizado." }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "Sessão inválida." }, 401);

  const { data: profile } = await admin.from("user_profiles").select("role, active").eq("id", user.id).maybeSingle();
  if (!profile?.active || profile.role !== "admin") return json({ error: "Acesso restrito a administradores." }, 403);

  if (req.method === "GET") {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return json({ error: error.message }, 400);
    const { data: profiles, error: profileError } = await admin.from("user_profiles").select("id, role, active, created_at, updated_at");
    if (profileError) return json({ error: profileError.message }, 400);
    const byId = new Map((profiles || []).map((p: any) => [p.id, p]));
    return json({ users: (data.users || []).map((u: any) => ({ id: u.id, email: u.email || "", created_at: u.created_at, last_sign_in_at: u.last_sign_in_at || null, role: byId.get(u.id)?.role || "staff", active: byId.get(u.id)?.active ?? false })) });
  }

  const body = await req.json().catch(() => ({}));

  if (req.method === "POST") {
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = body.role === "admin" ? "admin" : "staff";
    if (!email || !email.includes("@")) return json({ error: "Informe um e-mail válido." }, 400);
    if (password.length < 8) return json({ error: "A senha precisa ter pelo menos 8 caracteres." }, 400);

    const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (createError || !created.user) return json({ error: createError?.message || "Não foi possível criar o usuário." }, 400);

    const { error: profileError } = await admin.from("user_profiles").insert({ id: created.user.id, role, active: true });
    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: profileError.message }, 400);
    }
    return json({ user: { id: created.user.id, email: created.user.email, role, active: true, created_at: created.user.created_at } }, 201);
  }

  if (req.method === "PATCH") {
    const id = String(body.id || "");
    const active = typeof body.active === "boolean" ? body.active : undefined;
    const role = body.role === "admin" ? "admin" : body.role === "staff" ? "staff" : undefined;
    if (!id) return json({ error: "Usuário não informado." }, 400);
    if (id === user.id && active === false) return json({ error: "Você não pode desativar o próprio usuário." }, 400);
    if (id === user.id && role && role !== "admin") return json({ error: "Você não pode remover seu próprio perfil de administrador." }, 400);

    const { data: target } = await admin.from("user_profiles").select("id, role, active").eq("id", id).maybeSingle();
    if (!target) return json({ error: "Perfil não encontrado." }, 404);

    if (target.role === "admin" && (role === "staff" || active === false)) {
      const { count } = await admin.from("user_profiles").select("id", { count: "exact", head: true }).eq("role", "admin").eq("active", true);
      if ((count || 0) <= 1) return json({ error: "É necessário manter pelo menos um administrador ativo." }, 400);
    }

    const changes: Record<string, unknown> = {};
    if (active !== undefined) changes.active = active;
    if (role !== undefined) changes.role = role;
    if (!Object.keys(changes).length) return json({ error: "Nenhuma alteração informada." }, 400);

    const { data: updated, error } = await admin.from("user_profiles").update(changes).eq("id", id).select("id, role, active, updated_at").single();
    if (error) return json({ error: error.message }, 400);
    return json({ user: updated });
  }

  return json({ error: "Método não permitido." }, 405);
});
