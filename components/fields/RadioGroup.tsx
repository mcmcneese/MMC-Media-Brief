"use client";

import { useId } from "react";

interface RadioGroupProps {
  label: string;
  name: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  layout?: "horizontal" | "vertical";
  shake?: boolean;
  /** When true, shows a gold "Needs your input" hint next to the legend. */
  needsInput?: boolean;
}

export default function RadioGroup({
  label,
  name,
  helpText,
  error,
  required,
  options,
  value,
  onChange,
  layout = "vertical",
  shake,
  needsInput,
}: RadioGroupProps) {
  const reactId = useId();
  const groupId = `rg-${reactId}`;
  const helpId = helpText ? `${groupId}-help` : undefined;
  const errId = error ? `${groupId}-err` : undefined;

  return (
    <fieldset
      className={`flex flex-col gap-2 ${shake ? "mmc-shake" : ""}`}
      aria-describedby={[helpId, errId].filter(Boolean).join(" ") || undefined}
      aria-invalid={error ? "true" : "false"}
    >
      <legend className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-mmc-text">
        <span>
          {label}
          {required ? <span aria-hidden="true" className="text-mmc-error"> *</span> : null}
        </span>
        {needsInput ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-mmc-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-mmc-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-mmc-gold" aria-hidden="true" />
            Needs your input
          </span>
        ) : null}
      </legend>
      <div
        className={`flex ${layout === "horizontal" ? "flex-row flex-wrap gap-4" : "flex-col gap-2"}`}
      >
        {options.map((opt) => {
          const checked = value === opt;
          const optId = `${groupId}-${opt.replace(/\s+/g, "-")}`;
          return (
            <label
              key={opt}
              htmlFor={optId}
              className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition ${
                checked
                  ? "border-mmc-accent bg-white"
                  : "border-mmc-border bg-white hover:border-mmc-dark/40"
              }`}
            >
              <input
                id={optId}
                type="radio"
                name={name}
                value={opt}
                checked={checked}
                onChange={() => onChange(opt)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`inline-flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 ${
                  checked ? "border-mmc-accent" : "border-mmc-border"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${checked ? "bg-mmc-accent" : "bg-transparent"}`}
                />
              </span>
              <span className="text-sm text-mmc-text">{opt}</span>
            </label>
          );
        })}
      </div>
      {helpText ? (
        <p id={helpId} className="text-xs text-mmc-muted">
          {helpText}
        </p>
      ) : null}
      {error ? (
        <p id={errId} className="text-xs text-mmc-error">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
