import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

function normalizeSupabaseUrl(rawUrl: string | undefined): string | null {
  if (!rawUrl) return null;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }
  return `https://${rawUrl}`;
}

export function createClient() {
  const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing or invalid");
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
}
