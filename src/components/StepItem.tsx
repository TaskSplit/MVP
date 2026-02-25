"use client";

import { Step } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepItemProps {
  step: Step;
  onToggle: (isCompleted: boolean) => void;
}

export function StepItem({ step, onToggle }: StepItemProps) {
  return (
    <label className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-card-hover cursor-pointer group">
      {/* Custom checkbox */}
      <div className="mt-0.5 shrink-0">
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggle(!step.is_completed);
          }}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded border-2 transition-all",
            step.is_completed
              ? "border-accent bg-accent text-white"
              : "border-muted/50 hover:border-accent/50 group-hover:border-accent/50"
          )}
        >
          {step.is_completed && <Check className="h-3 w-3" strokeWidth={3} />}
        </button>
      </div>

      {/* Step text */}
      <span
        className={cn(
          "text-sm leading-relaxed transition-colors",
          step.is_completed ? "text-muted line-through" : "text-foreground"
        )}
      >
        {step.title}
      </span>
    </label>
  );
}
