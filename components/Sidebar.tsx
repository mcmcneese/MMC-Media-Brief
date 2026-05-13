"use client";

import { Check } from "lucide-react";
import type { StepIndex } from "@/lib/types";

interface SidebarProps {
  currentStep: StepIndex;
  maxVisitedStep: StepIndex;
  onJump: (step: StepIndex) => void;
}

// Short labels for the sidebar; full titles appear on each step page.
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
    <nav aria-label="Brief progress" className="sticky top-24">
      <p className="mmc-kicker mb-4 px-1">Your Brief</p>
      <ol className="flex flex-col">
        {STEP_LABELS.map((label, idx) => {
          const i = idx as StepIndex;
          const num = String(idx + 1).padStart(2, "0");
          const isCurrent = i === currentStep;
          const isVisited = i <= maxVisitedStep;
          const isCompleted = i < currentStep && isVisited;
          const isClickable = isVisited;
          const isLast = idx === STEP_LABELS.length - 1;

          // Number color/state
          const numClass = isCurrent
            ? "text-mmc-gold"
            : isVisited
            ? "text-mmc-gold/80"
            : "text-mmc-border";

          // Label color/state
          const labelClass = isCurrent
            ? "text-mmc-purple font-semibold"
            : isVisited
            ? "text-mmc-text"
            : "text-mmc-muted";

          return (
            <li key={label} className={isLast ? "" : "border-b border-mmc-border/60"}>
              <button
                type="button"
                onClick={() => {
                  if (isClickable) onJump(i);
                }}
                disabled={!isClickable}
                aria-current={isCurrent ? "step" : undefined}
                className={`group flex w-full items-center gap-4 py-3.5 text-left transition ${
                  isClickable
                    ? "hover:bg-mmc-creamDeep/40 px-2 -mx-2 rounded-sm cursor-pointer"
                    : "px-2 -mx-2 cursor-not-allowed"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex-none font-bold tabular-nums ${numClass} ${
                    isCurrent ? "text-2xl" : "text-xl"
                  }`}
                >
                  {num}
                </span>
                <span className={`flex-1 text-sm leading-tight ${labelClass}`}>
                  {label}
                </span>
                {isCompleted ? (
                  <Check
                    size={16}
                    strokeWidth={2.5}
                    className="flex-none text-mmc-gold"
                    aria-label="completed"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
