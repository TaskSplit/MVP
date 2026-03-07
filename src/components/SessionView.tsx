"use client";

import { useEffect, useState, useCallback } from "react";
import { Session, RoundWithSteps, SessionFile } from "@/lib/types/database";
import { ProgressBar } from "@/components/ProgressBar";
import { RoundCircleNav } from "@/components/RoundCircleNav";
import { RoundDetailView } from "@/components/RoundDetailView";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2, RotateCcw, FileText, Paperclip, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SessionStatus } from "@/lib/types/database";
import { PlitChat } from "@/components/PlitChat";

interface SessionViewProps {
  session: Session;
  rounds: RoundWithSteps[];
  files?: SessionFile[];
}

export function SessionView({ session, rounds: initialRounds, files = [] }: SessionViewProps) {
  const [rounds, setRounds] = useState<RoundWithSteps[]>(initialRounds);
  const [activeRound, setActiveRound] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>(session.status ?? "active");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Check if we need to generate the breakdown (no rounds yet)
  const needsGeneration = initialRounds.length === 0;

  const generateBreakdown = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/mvp/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          prompt: session.prompt,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to generate breakdown (${res.status})`);
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

  const isCompleted = status === "completed";

  const handleStatusChange = async (newStatus: SessionStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch("/mvp/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        router.refresh();
      }
    } catch {
      // Silently fail
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      await fetch("/mvp/api/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });
      router.push("/");
    } catch {
      setIsDeleting(false);
    }
  };

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
      const res = await fetch("/mvp/api/steps", {
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
      {/* Completed banner */}
      {isCompleted && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-success/20 bg-success/10 px-5 py-3">
          <span className="flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" />
            This task is finished
          </span>
          <button
            onClick={() => handleStatusChange("active")}
            disabled={isUpdatingStatus}
            className="flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium text-muted hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reopen
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              {session.title || "Untitled Session"}
            </h1>
            <p className="text-muted">{session.prompt}</p>
            {/* Attached files */}
            {files.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Paperclip className="h-3.5 w-3.5 text-muted" />
                {files.map((file) => (
                  <span
                    key={file.id}
                    className="inline-flex items-center gap-1 rounded-md bg-accent/10 border border-accent/15 px-2 py-0.5 text-xs text-accent-light"
                  >
                    <FileText className="h-3 w-3" />
                    {file.file_name}
                  </span>
                ))}
              </div>
            )}
            <div className="mb-6" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isCompleted && rounds.length > 0 && (
              <button
                onClick={() => handleStatusChange("completed")}
                disabled={isUpdatingStatus}
                className="flex items-center gap-2 rounded-lg bg-success/20 px-4 py-2 text-sm font-semibold text-success transition-all hover:bg-success/30 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Finish Task
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted transition-all hover:border-danger/30 hover:text-danger hover:bg-danger/10 disabled:opacity-50"
              title="Delete task"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
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

      {/* Plit AI Assistant */}
      <PlitChat
        sessionId={session.id}
        sessionTitle={session.title || "Untitled Session"}
        prompt={session.prompt}
        rounds={rounds}
        activeRound={activeRound}
        files={files}
        onActionComplete={() => window.location.reload()}
      />
    </div>
  );
}
