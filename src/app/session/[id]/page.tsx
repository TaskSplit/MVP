export const runtime = 'edge'; // ADD THIS LINE

import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { SessionView } from "@/components/SessionView";
import { notFound } from "next/navigation";
import { RoundWithSteps } from "@/lib/types/database";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch session
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (!session) {
    notFound();
  }

  // Fetch rounds with steps
  const { data: rounds } = await supabase
    .from("rounds")
    .select("*, steps(*)")
    .eq("session_id", id)
    .order("order_index", { ascending: true });

  // Sort steps within each round
  const roundsWithSortedSteps: RoundWithSteps[] = (rounds ?? []).map((r) => ({
    ...r,
    steps: (r.steps ?? []).sort(
      (a: { order_index: number }, b: { order_index: number }) =>
        a.order_index - b.order_index
    ),
  }));

  return (
    <div className="min-h-screen">
      <Navbar userEmail={user?.email} />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent-light transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <SessionView
          session={session}
          rounds={roundsWithSortedSteps}
        />
      </main>
    </div>
  );
}
