"use client";

import { Check } from "lucide-react";
import type { StepIndex } from "@/lib/types";

interface SidebarProps {
  currentStep: StepIndex;
  maxVisitedStep: StepIndex;
  onJump: (step: StepIndex) => void;
}

// Short labels for the sidebar (full labels are used on the step pages themselves)
const STEP_LABELS = [
  "Contact",
  "Company",
  "Audience",
  "Past Media",
  "Campaign",
  "Review",
] as const;

export default function Sidebar({ currentStep, maxVisitedStep, onJump }: SidebarProps) {
  return (
    <nav aria-label="Form progress" className="sticky top-24">
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-mmc-muted">
        Your Brief
      </p>
      <ol className="flex flex-col gap-1">
        {STEP_LABELS.map((label, idx) => {
          const i = idx as StepIndex;
          const isCurrent = i === currentStep;
          const isVisited = i <= maxVisitedStep;
          const isCompleted = i < currentStep && isVisited;
          const isClickable = isVisited;

          const baseRow =
            "group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition";
          const stateClasses = isCurrent
            ? "bg-mmc-accent/10 text-mmc-accent"
            : isVisited
            ? "text-mmc-text hover:bg-mmc-border/60 cursor-pointer"
            : "text-mmc-muted cursor-not-allowed opacity-70";

          const indicatorClasses = isCurrent
            ? "border-mmc-accent bg-mmc-accent text-white"
            : isCompleted
            ? "border-mmc-accent bg-white text-mmc-accent"
            : isVisited
            ? "border-mmc-accent bg-white text-mmc-accent"
            : "border-mmc-border bg-white text-mmc-muted";

          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => {
                  if (isClickable) onJump(i);
                }}
                disabled={!isClickable}
                aria-current={isCurrent ? "step" : undefined}
                className={`${baseRow} ${stateClasses}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 text-xs font-semibold ${indicatorClasses}`}
                >
                  {isCompleted ? <Check size={12} strokeWidth={3} /> : idx + 1}
                </span>
                <span className="text-sm font-medium">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
