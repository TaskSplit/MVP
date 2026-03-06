export const runtime = 'edge';

import { createRouteHandlerClient } from "@/lib/supabase/route";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

interface PlitMessage {
  role: "user" | "assistant";
  content: string;
}

interface PlitRequest {
  sessionId: string;
  message: string;
  history: PlitMessage[];
  context: {
    prompt: string;
    sessionTitle: string;
    rounds: {
      id: string;
      name: string;
      order_index: number;
      steps: {
        id: string;
        title: string;
        is_completed: boolean;
        order_index: number;
      }[];
    }[];
    activeRound: number;
    files?: {
      file_name: string;
      file_size: number;
      mime_type: string;
    }[];
  };
}

export async function POST(request: Request) {
  const { supabase, applyResponseCookies } = createRouteHandlerClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(user.id, "plit", { maxRequests: 20, windowSec: 60 });
  if (limited) return limited;

  const body: PlitRequest = await request.json();
  const { sessionId, message, history, context } = body;

  if (!sessionId || !message) {
    return NextResponse.json(
      { error: "sessionId and message are required" },
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
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (!openRouterKey) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Build context description for the AI
    const roundsDescription = context.rounds
      .map((r, i) => {
        const stepsText = r.steps
          .map(
            (s, j) =>
              `  ${j + 1}. [${s.is_completed ? "DONE" : "TODO"}] ${s.title}`
          )
          .join("\n");
        const isCurrent = i === context.activeRound ? " (USER IS CURRENTLY VIEWING THIS ROUND)" : "";
        return `Round ${i + 1}: ${r.name}${isCurrent}\n${stepsText}`;
      })
      .join("\n\n");

    const filesDescription = context.files && context.files.length > 0
      ? `\nATTACHED FILES:\n${context.files.map((f) => `- ${f.file_name} (${f.mime_type}, ${(f.file_size / 1024).toFixed(0)}KB)`).join("\n")}\nThe AI breakdown was generated with these files as context. Reference them when relevant.`
      : "";

    const systemPrompt = `You are Plit, the friendly AI assistant for TaskSplit. You help users work through their task breakdowns.

The user is working on a project. Here's the context:

PROJECT: ${context.sessionTitle}
ORIGINAL PROMPT: ${context.prompt}

CURRENT BREAKDOWN:
${roundsDescription}
${filesDescription}

YOUR CAPABILITIES:
1. **Help & Guidance**: Answer questions, explain steps, give tips, and help users who are stuck on any step.
2. **Regenerate Round**: If the user says a round isn't relevant or wants different steps, you can suggest regenerating it.
3. **Regenerate Specific Steps**: If specific steps aren't useful, you can replace them.

RESPONSE FORMAT:
You must always respond with valid JSON in this exact format:
{
  "reply": "Your friendly message to the user",
  "action": null
}

OR if the user wants to regenerate a round:
{
  "reply": "Your message explaining what you're doing",
  "action": {
    "type": "regenerate_round",
    "roundIndex": 0
  }
}

OR if the user wants to regenerate specific steps (provide replacement step titles):
{
  "reply": "Your message explaining the changes",
  "action": {
    "type": "replace_steps",
    "roundIndex": 0,
    "replacements": [
      { "stepIndex": 2, "newTitle": "New step description here" }
    ]
  }
}

PERSONALITY:
- You're helpful, encouraging, and concise
- Use casual, friendly language
- Keep replies short (2-4 sentences typically)
- When the user seems stuck, offer specific, actionable suggestions
- If they want to change steps, confirm what you're changing
- Always respond with valid JSON only, nothing else`;

    // Build message history for context
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...history.slice(-10).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.role === "assistant" ? JSON.stringify({ reply: m.content, action: null }) : m.content,
      })),
      { role: "user" as const, content: message },
    ];

    const aiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterKey}`,
          "HTTP-Referer": "https://tasksplitai.com/mvp/",
          "X-Title": "TaskSplit",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages,
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

    // Parse response
    let jsonString = responseText.trim();
    const fenceMatch = jsonString.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
    if (fenceMatch) {
      jsonString = fenceMatch[1].trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      // If parsing fails, treat the whole thing as a text reply
      parsed = { reply: responseText, action: null };
    }

    const reply = parsed.reply || "I'm not sure how to help with that. Could you rephrase?";
    const action = parsed.action || null;

    // If there's a regenerate_round action, execute it
    if (action?.type === "regenerate_round" && typeof action.roundIndex === "number") {
      const roundToRegenerate = context.rounds[action.roundIndex];
      if (roundToRegenerate) {
        // Generate new steps for this round
        const regenResponse = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openRouterKey}`,
              "HTTP-Referer": "https://tasksplitai.com/mvp/",
              "X-Title": "TaskSplit",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                {
                  role: "system",
                  content: `You are a project planning assistant. Generate new steps for a specific round of a project breakdown.

PROJECT: ${context.sessionTitle}
ORIGINAL PROMPT: ${context.prompt}
ROUND NAME: ${roundToRegenerate.name}
USER FEEDBACK: ${message}

Generate 3-8 new, specific, actionable micro-steps for this round that address the user's feedback.
Return ONLY a JSON array of step strings, e.g.: ["Step 1", "Step 2", "Step 3"]`,
                },
                { role: "user", content: `Regenerate steps for "${roundToRegenerate.name}" based on my feedback: ${message}` },
              ],
              temperature: 0.7,
              response_format: { type: "json_object" },
            }),
          }
        );

        if (regenResponse.ok) {
          const regenData = await regenResponse.json();
          let regenText = regenData.choices?.[0]?.message?.content?.trim() || "";
          const regenFence = regenText.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
          if (regenFence) regenText = regenFence[1].trim();

          let newSteps: string[];
          try {
            const regenParsed = JSON.parse(regenText);
            newSteps = Array.isArray(regenParsed) ? regenParsed : regenParsed.steps || [];
          } catch {
            newSteps = [];
          }

          if (newSteps.length > 0) {
            // Delete old steps
            await supabase
              .from("steps")
              .delete()
              .eq("round_id", roundToRegenerate.id);

            // Insert new steps
            const stepsToInsert = newSteps.map((title: string, idx: number) => ({
              round_id: roundToRegenerate.id,
              title,
              order_index: idx,
              is_completed: false,
            }));

            await supabase.from("steps").insert(stepsToInsert);

            return applyResponseCookies(
              NextResponse.json({
                reply,
                action: { type: "regenerate_round", roundIndex: action.roundIndex, reload: true },
              })
            );
          }
        }
      }
    }

    // If there's a replace_steps action, execute it
    if (action?.type === "replace_steps" && Array.isArray(action.replacements)) {
      const roundIndex = action.roundIndex;
      const round = context.rounds[roundIndex];
      if (round) {
        for (const replacement of action.replacements) {
          const step = round.steps[replacement.stepIndex];
          if (step && replacement.newTitle) {
            await supabase
              .from("steps")
              .update({ title: replacement.newTitle })
              .eq("id", step.id);
          }
        }

        return applyResponseCookies(
          NextResponse.json({
            reply,
            action: { type: "replace_steps", reload: true },
          })
        );
      }
    }

    return applyResponseCookies(NextResponse.json({ reply, action }));
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    console.error("Plit error:", errMessage, err);
    return NextResponse.json(
      { error: `Something went wrong: ${errMessage}` },
      { status: 500 }
    );
  }
}
