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

  const limited = rateLimit(user.id, "breakdown", { maxRequests: 5, windowSec: 60 });
  if (limited) return limited;

  const { sessionId, prompt } = await request.json();

  if (!sessionId || !prompt) {
    return NextResponse.json(
      { error: "sessionId and prompt are required" },
      { status: 400 }
    );
  }

  // Verify session ownership
  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    // Call OpenRouter API (free model)
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (!openRouterKey) {
      return NextResponse.json(
        { error: "AI service not configured. Set OPENROUTER_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a project planning assistant. The user will describe a project or task. Break it down into structured rounds (chapters/phases) with micro-steps.

Return a JSON object with this exact structure:
{
  "title": "A concise title for the project (max 60 chars)",
  "rounds": [
    {
      "name": "Phase Name",
      "steps": [
        "Step description 1",
        "Step description 2"
      ]
    }
  ]
}

Rules:
- Create 2-4 rounds depending on project complexity
- Each round should have 3-8 specific, actionable micro-steps
- Steps should be concrete and achievable (not vague)
- Round names should be just the phase name (e.g. "Project Setup", "Core Features"), without numbering — the UI handles numbering
- Return ONLY valid JSON, no markdown or extra text`;

    const aiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "TaskSplit",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("OpenRouter API error:", errorText);
      return NextResponse.json(
        { error: "AI service error" },
        { status: 502 }
      );
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content;

    if (!responseText) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 502 }
      );
    }

    const breakdown = JSON.parse(responseText);

    // Update session title
    await supabase
      .from("sessions")
      .update({ title: breakdown.title })
      .eq("id", sessionId);

    // Insert rounds and steps
    for (let i = 0; i < breakdown.rounds.length; i++) {
      const round = breakdown.rounds[i];

      const { data: roundData, error: roundError } = await supabase
        .from("rounds")
        .insert({
          session_id: sessionId,
          name: round.name,
          order_index: i,
        })
        .select()
        .single();

      if (roundError || !roundData) {
        console.error("Round insert error:", roundError);
        continue;
      }

      const stepsToInsert = round.steps.map(
        (stepTitle: string, stepIndex: number) => ({
          round_id: roundData.id,
          title: stepTitle,
          order_index: stepIndex,
          is_completed: false,
        })
      );

      const { error: stepsError } = await supabase
        .from("steps")
        .insert(stepsToInsert);

      if (stepsError) {
        console.error("Steps insert error:", stepsError);
      }
    }

    return NextResponse.json({ success: true, breakdown });
  } catch (err) {
    console.error("AI breakdown error:", err);
    return NextResponse.json(
      { error: "Failed to generate breakdown" },
      { status: 500 }
    );
  }
}
