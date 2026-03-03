export const runtime = 'edge';

import { createRouteHandlerClient } from "@/lib/supabase/route";
import { NextResponse } from "next/server";

const BASE_PATH = "/mvp";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

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
