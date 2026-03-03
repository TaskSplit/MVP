import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { NextResponse } from "next/server";

/**
 * Create a Supabase client for Route Handlers (API routes) on Edge Runtime.
 * Reads cookies directly from the Request instead of using next/headers cookies().
 */
export function createRouteHandlerClient(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const url =
    supabaseUrl && supabaseUrl.startsWith("http")
      ? supabaseUrl
      : "http://localhost:54321";
  const key = supabaseAnonKey || "placeholder-key";

  // We'll collect Set-Cookie headers to apply to the response later
  const responseCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        const cookieHeader = request.headers.get("cookie") ?? "";
        return parseCookieHeader(cookieHeader).map(({ name, value }) => ({
          name,
          value: value ?? "",
        }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach((cookie) => {
          responseCookies.push(cookie);
        });
      },
    },
  });

  /**
   * Apply any cookies set by Supabase (e.g., token refresh) to a NextResponse.
   */
  function applyResponseCookies(response: NextResponse) {
    responseCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as Record<string, string>);
    });
    return response;
  }

  return { supabase, applyResponseCookies };
}
