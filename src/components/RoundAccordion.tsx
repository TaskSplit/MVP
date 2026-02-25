"use client";

import { useState } from "react";
import { RoundWithSteps } from "@/lib/types/database";
import { StepItem } from "@/components/StepItem";
import { ChevronDown, CircleCheck, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoundAccordionProps {
  round: RoundWithSteps;
  defaultOpen: boolean;
  onStepToggle: (stepId: string, isCompleted: boolean) => void;
}

export function RoundAccordion({
  round,
  defaultOpen,
  onStepToggle,
}: RoundAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const completedCount = round.steps.filter((s) => s.is_completed).length;
  const totalCount = round.steps.length;
  const allCompleted = completedCount === totalCount && totalCount > 0;

  return (
    <div className="glass-card !p-0 overflow-hidden" style={{ cursor: "default" }}>
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-card-hover"
      >
        <div className="flex items-center gap-3">
          {allCompleted ? (
            <CircleCheck className="h-5 w-5 text-success shrink-0" />
          ) : (
            <Circle className="h-5 w-5 text-muted shrink-0" />
          )}
          <div>
            <h3
              className={cn(
                "font-semibold text-foreground",
                allCompleted && "text-success"
              )}
            >
              {round.name}
            </h3>
            <span className="text-xs text-muted">
              {completedCount}/{totalCount} steps completed
            </span>
          </div>
        </div>

        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Steps */}
      {isOpen && (
        <div className="border-t border-border px-5 py-3">
          <div className="space-y-1">
            {round.steps.map((step) => (
              <StepItem
                key={step.id}
                step={step}
                onToggle={(isCompleted) => onStepToggle(step.id, isCompleted)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
