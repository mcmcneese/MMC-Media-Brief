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
      <legend className="tl-label flex w-full flex-wrap items-center gap-x-2 gap-y-1">
        <span>
          {label}
          {required ? <span aria-hidden="true" className="text-mmc-error"> *</span> : null}
        </span>
        {needsInput ? (
          <span className="tl-pill ml-auto">Needs your answer</span>
        ) : null}
      </legend>
      <div
        className="flex flex-row flex-wrap gap-2"
      >
        {options.map((opt) => {
          const checked = value === opt;
          const optId = `${groupId}-${opt.replace(/\s+/g, "-")}`;
          return (
            <label key={opt} htmlFor={optId} className={`tl-chip ${checked ? "tl-chip-on" : ""}`}>
              <input
                id={optId}
                type="radio"
                name={name}
                value={opt}
                checked={checked}
                onChange={() => onChange(opt)}
                className="sr-only"
              />
              {opt}
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
