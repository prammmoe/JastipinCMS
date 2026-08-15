import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/server/env";

const authOptions = { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } } as const;

export function createAuthClient(): SupabaseClient {
  const config = env();
  return createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, authOptions);
}

let admin: SupabaseClient | undefined;
export function createAdminClient(): SupabaseClient {
  const config = env();
  admin ??= createClient(config.SUPABASE_URL, config.SUPABASE_SECRET_KEY, authOptions);
  return admin;
}

