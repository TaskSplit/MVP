"use client";

import { RoundWithSteps } from "@/lib/types/database";
import { StepItem } from "@/components/StepItem";
import { cn } from "@/lib/utils";
import { CircleCheck, Circle, ListChecks } from "lucide-react";

interface RoundDetailViewProps {
  round: RoundWithSteps;
  roundIndex: number;
  totalRounds: number;
  onStepToggle: (stepId: string, isCompleted: boolean) => void;
}

export function RoundDetailView({
  round,
  roundIndex,
  totalRounds,
  onStepToggle,
}: RoundDetailViewProps) {
  const completedCount = round.steps.filter((s) => s.is_completed).length;
  const totalCount = round.steps.length;
  const allCompleted = completedCount === totalCount && totalCount > 0;
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="glass-card !p-0 overflow-hidden" style={{ cursor: "default" }}>
      {/* Round header */}
      <div className="relative overflow-hidden border-b border-border p-6 sm:p-8">
        {/* Subtle gradient background */}
        <div
          className={cn(
            "absolute inset-0 opacity-10",
            allCompleted
              ? "bg-gradient-to-br from-success/30 to-transparent"
              : "bg-gradient-to-br from-accent/30 to-transparent"
          )}
        />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Round icon */}
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                allCompleted
                  ? "bg-success/20 text-success"
                  : "bg-accent/20 text-accent"
              )}
            >
              {allCompleted ? (
                <CircleCheck className="h-6 w-6" />
              ) : (
                <ListChecks className="h-6 w-6" />
              )}
            </div>

            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
                Round {roundIndex + 1} of {totalRounds}
              </p>
              <h2
                className={cn(
                  "text-xl font-bold sm:text-2xl",
                  allCompleted ? "text-success" : "text-foreground"
                )}
              >
                {round.name}
              </h2>
            </div>
          </div>

          {/* Completion badge */}
          <div
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
              allCompleted
                ? "bg-success/20 text-success"
                : percentage > 0
                ? "bg-accent/20 text-accent-light"
                : "bg-border text-muted"
            )}
          >
            {completedCount}/{totalCount}
          </div>
        </div>

        {/* Mini progress bar for this round */}
        <div className="relative mt-4 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              allCompleted
                ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                : "progress-fill"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Steps list */}
      <div className="p-4 sm:p-6">
        <div className="space-y-1">
          {round.steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3">
              {/* Step number */}
              <span
                className={cn(
                  "mt-3 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold",
                  step.is_completed
                    ? "bg-accent/10 text-muted"
                    : "bg-accent/10 text-accent-light"
                )}
              >
                {index + 1}
              </span>

              {/* Step item */}
              <div className="flex-1">
                <StepItem
                  step={step}
                  onToggle={(isCompleted) => onStepToggle(step.id, isCompleted)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Completed state */}
        {allCompleted && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-success/10 py-3 text-sm font-medium text-success">
            <CircleCheck className="h-4 w-4" />
            Round completed!
          </div>
        )}
      </div>
    </div>
  );
}
