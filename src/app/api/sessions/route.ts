import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(user.id, "sessions", { maxRequests: 10, windowSec: 60 });
  if (limited) return limited;

  const { prompt } = await request.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json(
      { error: "Prompt is required" },
      { status: 400 }
    );
  }

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      user_id: user.id,
      prompt,
      title: "", // Will be set after AI response
    })
    .select()
    .single();

  if (sessionError) {
    return NextResponse.json(
      { error: sessionError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ sessionId: session.id });
}
