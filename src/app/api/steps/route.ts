import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { stepId, isCompleted } = await request.json();

  if (!stepId || typeof isCompleted !== "boolean") {
    return NextResponse.json(
      { error: "stepId and isCompleted are required" },
      { status: 400 }
    );
  }

  // Verify ownership through the join chain
  const { data: step } = await supabase
    .from("steps")
    .select("id, round_id, rounds(session_id, sessions(user_id))")
    .eq("id", stepId)
    .single();

  if (!step) {
    return NextResponse.json({ error: "Step not found" }, { status: 404 });
  }

  // Update step
  const { error } = await supabase
    .from("steps")
    .update({ is_completed: isCompleted })
    .eq("id", stepId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
