export const runtime = 'edge';

import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { PartyPopper, Home, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface FinishPageProps {
  params: Promise<{ id: string }>;
}

export default async function FinishPage({ params }: FinishPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const isGuest = user.is_anonymous ?? false;

  // Fetch session
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (!session) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <Navbar userEmail={user?.email} isGuest={isGuest} />

      <main className="mx-auto max-w-4xl px-4 py-24 sm:px-6 flex flex-col items-center justify-center text-center mt-8">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-success/20 text-success shadow-[0_0_40px_rgba(34,197,94,0.3)]">
          <PartyPopper className="h-12 w-12" />
        </div>
        
        <h1 className="mb-4 text-4xl font-bold text-foreground sm:text-5xl tracking-tight">
          Incredible Work!
        </h1>
        <p className="mb-12 max-w-lg text-lg text-muted/90">
          You have successfully completed <strong className="text-foreground">{session.title || "your task"}</strong>. Take a moment to celebrate this achievement. You crushed it!
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full justify-center max-w-md">
          <Link
            href="/"
            className="btn-primary w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3.5 text-base sm:whitespace-nowrap"
          >
            <Home className="h-5 w-5" />
            Go to Home
          </Link>
          
          <Link
            href={`/session/${id}`}
            className="flex w-full sm:w-auto flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-base font-medium text-foreground transition-all hover:bg-card-hover hover:border-accent/30 sm:whitespace-nowrap"
          >
            <ArrowLeft className="h-5 w-5 text-muted" />
            Go Back
          </Link>
        </div>
      </main>
    </div>
  );
}