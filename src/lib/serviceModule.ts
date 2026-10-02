import { supabase } from "@/integrations/supabase/client";

const moduleCache = new Map<string, string>();

export async function getServiceModuleId(key: string): Promise<string | null> {
  const cached = moduleCache.get(key);
  if (cached) return cached;

  const { data, error } = await (supabase as any)
    .from("service_modules")
    .select("id")
    .eq("key", key)
    .eq("active", true)
    .single();

  if (error || !data?.id) return null;
  moduleCache.set(key, data.id);
  return data.id;
}
