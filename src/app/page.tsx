export const runtime = 'edge'; // ADD THIS LINE

import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { PromptInput } from "@/components/PromptInput";
import { SessionList } from "@/components/SessionList";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*, rounds(id)")
    .order("created_at", { ascending: false });

  const sessionsWithRoundCount = (sessions ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    prompt: s.prompt,
    created_at: s.created_at,
    round_count: Array.isArray(s.rounds) ? s.rounds.length : 0,
  }));

  return (
    <div className="min-h-screen">
      <Navbar userEmail={user?.email} />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* Hero prompt section */}
        <section className="mb-16 text-center">
          <h1 className="mb-3 text-4xl font-bold text-foreground sm:text-5xl">
            What are you going to
            <span className="text-accent"> work on</span>?
          </h1>
          <p className="mb-8 text-lg text-muted">
            Describe your project or task and AI will break it into structured
            rounds and micro-steps.
          </p>
          <PromptInput />
        </section>

        {/* Past sessions */}
        {sessionsWithRoundCount.length > 0 && (
          <section>
            <h2 className="mb-6 text-xl font-semibold text-foreground">
              Past Sessions
            </h2>
            <SessionList sessions={sessionsWithRoundCount} />
          </section>
        )}
      </main>
    </div>
  );
}
