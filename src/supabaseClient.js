import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (typeof window !== "undefined") {
  console.info("[CSE Auth] Supabase client configuration", {
    configured: supabaseConfigured,
    url: supabaseUrl || null,
    hasAnonKey: Boolean(supabaseAnonKey),
    flowType: "pkce",
    storageKey: "cse-reviewer-supabase-auth"
  });
}

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce",
        storageKey: "cse-reviewer-supabase-auth"
      }
    })
  : null;
