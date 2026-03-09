export const runtime = 'edge';

import { createRouteHandlerClient } from "@/lib/supabase/route";
import { NextResponse } from "next/server";

const BASE_PATH = "/mvp";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // On Cloudflare Pages, request.url may reflect the internal worker URL rather
  // than the public domain. Prefer NEXT_PUBLIC_SITE_URL when set, then fall back
  // to the x-forwarded-host header that Cloudflare injects with the real host.
  const host =
    request.headers.get("x-forwarded-host") ?? requestUrl.host;
  const origin = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${requestUrl.protocol}//${host}`
  ).replace(/\/+$/, "");

  if (code) {
    const { supabase, applyResponseCookies } = createRouteHandlerClient(request);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${BASE_PATH}${next}`);
      return applyResponseCookies(response);
    }
  }

  // Return to auth page on error
  return NextResponse.redirect(`${origin}${BASE_PATH}/auth?error=auth_callback_error`);
}
