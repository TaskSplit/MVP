"use client";

import { useEffect, useState, useCallback } from "react";
import { Session, RoundWithSteps } from "@/lib/types/database";
import { ProgressBar } from "@/components/ProgressBar";
import { RoundCircleNav } from "@/components/RoundCircleNav";
import { RoundDetailView } from "@/components/RoundDetailView";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface SessionViewProps {
  session: Session;
  rounds: RoundWithSteps[];
}

export function SessionView({ session, rounds: initialRounds }: SessionViewProps) {
  const [rounds, setRounds] = useState<RoundWithSteps[]>(initialRounds);
  const [activeRound, setActiveRound] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we need to generate the breakdown (no rounds yet)
  const needsGeneration = initialRounds.length === 0;

  const generateBreakdown = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          prompt: session.prompt,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate breakdown");
      }

      // Reload the page to get fresh data
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsGenerating(false);
    }
  }, [session.id, session.prompt]);

  useEffect(() => {
    if (needsGeneration) {
      generateBreakdown();
    }
  }, [needsGeneration, generateBreakdown]);

  const totalSteps = rounds.reduce((acc, r) => acc + r.steps.length, 0);
  const completedSteps = rounds.reduce(
    (acc, r) => acc + r.steps.filter((s) => s.is_completed).length,
    0
  );

  const handleStepToggle = async (stepId: string, isCompleted: boolean) => {
    // Optimistic update
    setRounds((prev) =>
      prev.map((r) => ({
        ...r,
        steps: r.steps.map((s) =>
          s.id === stepId ? { ...s, is_completed: isCompleted } : s
        ),
      }))
    );

    try {
      const res = await fetch("/api/steps", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, isCompleted }),
      });

      if (!res.ok) {
        setRounds((prev) =>
          prev.map((r) => ({
            ...r,
            steps: r.steps.map((s) =>
              s.id === stepId ? { ...s, is_completed: !isCompleted } : s
            ),
          }))
        );
      }
    } catch {
      setRounds((prev) =>
        prev.map((r) => ({
          ...r,
          steps: r.steps.map((s) =>
            s.id === stepId ? { ...s, is_completed: !isCompleted } : s
          ),
        }))
      );
    }
  };

  // Generating state
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-6 relative">
          <div className="h-16 w-16 rounded-full border-2 border-accent/20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
          <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-transparent border-t-accent animate-spin" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">
          Splitting your task...
        </h2>
        <p className="text-muted max-w-md">
          AI is analyzing your project and breaking it down into structured
          rounds and micro-steps. This usually takes a few seconds.
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 rounded-lg bg-danger/10 border border-danger/20 px-6 py-4">
          <p className="text-danger">{error}</p>
        </div>
        <button onClick={generateBreakdown} className="btn-primary mt-4">
          Try Again
        </button>
      </div>
    );
  }

  const currentRound = rounds[activeRound];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          {session.title || "Untitled Session"}
        </h1>
        <p className="mb-6 text-muted">{session.prompt}</p>
        <ProgressBar completed={completedSteps} total={totalSteps} />
      </div>

      {/* Round circle navigator */}
      <RoundCircleNav
        rounds={rounds}
        activeRound={activeRound}
        onSelectRound={setActiveRound}
      />

      {/* Active round detail view */}
      {currentRound && (
        <div className="mt-8">
          <RoundDetailView
            round={currentRound}
            roundIndex={activeRound}
            totalRounds={rounds.length}
            onStepToggle={handleStepToggle}
          />

          {/* Navigation arrows */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setActiveRound((prev) => Math.max(0, prev - 1))}
              disabled={activeRound === 0}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-muted transition-all hover:border-accent/30 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous Round
            </button>
            <button
              onClick={() =>
                setActiveRound((prev) => Math.min(rounds.length - 1, prev + 1))
              }
              disabled={activeRound === rounds.length - 1}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-muted transition-all hover:border-accent/30 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted"
            >
              Next Round
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
