import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    !supabaseUrl.startsWith("http")
  ) {
    // During build/SSR with placeholder values, return a dummy that won't crash
    // This is safe because the middleware redirects unauthenticated users anyway
    if (typeof window === "undefined") {
      return createBrowserClient(
        "http://localhost:54321",
        "placeholder-key"
      );
    }
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
