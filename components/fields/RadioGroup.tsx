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
      <legend className="text-sm font-medium text-mmc-text">
        {label}
        {required ? <span aria-hidden="true" className="text-mmc-error"> *</span> : null}
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
                  className={`h-2 w-2 rounded-full ${checked ? "bg-mmc-dark" : "bg-transparent"}`}
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
