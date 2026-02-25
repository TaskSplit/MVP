"use client";

import { RoundWithSteps } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface RoundCircleNavProps {
  rounds: RoundWithSteps[];
  activeRound: number;
  onSelectRound: (index: number) => void;
}

export function RoundCircleNav({
  rounds,
  activeRound,
  onSelectRound,
}: RoundCircleNavProps) {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="flex items-center gap-0">
        {rounds.map((round, index) => {
          const completedCount = round.steps.filter(
            (s) => s.is_completed
          ).length;
          const totalCount = round.steps.length;
          const allCompleted =
            completedCount === totalCount && totalCount > 0;
          const isActive = index === activeRound;
          const hasProgress = completedCount > 0 && !allCompleted;

          return (
            <div key={round.id} className="flex items-center">
              {/* Connecting line (before circle, except first) */}
              {index > 0 && (
                <div
                  className={cn(
                    "h-0.5 w-8 sm:w-12 transition-colors duration-300",
                    index <= activeRound
                      ? "bg-accent"
                      : "bg-border"
                  )}
                />
              )}

              {/* Circle */}
              <button
                onClick={() => onSelectRound(index)}
                className={cn(
                  "relative flex items-center justify-center rounded-full transition-all duration-300 shrink-0",
                  isActive
                    ? "h-14 w-14 sm:h-16 sm:w-16"
                    : "h-10 w-10 sm:h-12 sm:w-12",
                  // Background & border
                  allCompleted
                    ? "bg-success/20 border-2 border-success"
                    : isActive
                    ? "bg-accent/20 border-2 border-accent shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                    : hasProgress
                    ? "bg-accent/10 border-2 border-accent/40"
                    : "bg-card border-2 border-border hover:border-accent/30"
                )}
                title={round.name}
              >
                {/* Completed check */}
                {allCompleted ? (
                  <Check
                    className={cn(
                      "text-success",
                      isActive ? "h-6 w-6" : "h-4 w-4"
                    )}
                    strokeWidth={3}
                  />
                ) : (
                  <span
                    className={cn(
                      "font-bold",
                      isActive
                        ? "text-lg text-accent-light"
                        : "text-sm text-muted"
                    )}
                  >
                    {index + 1}
                  </span>
                )}

                {/* Progress ring for partially completed rounds */}
                {hasProgress && (
                  <svg
                    className={cn(
                      "absolute inset-0",
                      isActive
                        ? "h-14 w-14 sm:h-16 sm:w-16"
                        : "h-10 w-10 sm:h-12 sm:w-12"
                    )}
                    viewBox="0 0 36 36"
                  >
                    <circle
                      className="text-accent/60"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${(completedCount / totalCount) * 100}, 100`}
                      cx="18"
                      cy="18"
                      r="15.9"
                      transform="rotate(-90 18 18)"
                    />
                  </svg>
                )}

                {/* Active pulse ring */}
                {isActive && !allCompleted && (
                  <div className="absolute inset-0 rounded-full border-2 border-accent/30 animate-ping" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
