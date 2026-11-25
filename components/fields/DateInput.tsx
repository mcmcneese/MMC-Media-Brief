"use client";

import { forwardRef, InputHTMLAttributes, useId } from "react";

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  shake?: boolean;
  /** When true, shows a gold "Needs your input" hint next to the label. */
  needsInput?: boolean;
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { label, helpText, error, required, shake, needsInput, className = "", id, ...rest },
  ref
) {
  const reactId = useId();
  const inputId = id ?? `d-${reactId}`;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errId = error ? `${inputId}-err` : undefined;

  const borderColor = error
    ? "border-mmc-error focus:border-mmc-error"
    : "border-mmc-border focus:border-mmc-dark";

  return (
    <div className={`flex flex-col gap-1.5 ${shake ? "mmc-shake" : ""}`}>
      <label htmlFor={inputId} className="tl-label flex w-full flex-wrap items-center gap-x-2 gap-y-1">
        <span>
          {label}
          {required ? <span aria-hidden="true" className="text-mmc-error"> *</span> : null}
        </span>
        {needsInput ? (
          <span className="tl-pill ml-auto">Needs your answer</span>
        ) : null}
      </label>
      <input
        id={inputId}
        ref={ref}
        type="date"
        aria-invalid={error ? "true" : "false"}
        aria-describedby={[helpId, errId].filter(Boolean).join(" ") || undefined}
        className={`w-full rounded-[10px] border ${borderColor} bg-white px-3.5 py-[11px] text-sm text-mmc-text outline-none transition focus:ring-2 focus:ring-mmc-gold focus:ring-offset-1 focus:ring-offset-white ${className}`}
        {...rest}
      />
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
    </div>
  );
});

export default DateInput;
