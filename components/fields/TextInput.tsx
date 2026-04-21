"use client";

import { forwardRef, InputHTMLAttributes, useId } from "react";

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  type?: "text" | "email" | "url";
  shake?: boolean;
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, helpText, error, required, type = "text", shake, className = "", id, ...rest },
  ref
) {
  const reactId = useId();
  const inputId = id ?? `t-${reactId}`;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errId = error ? `${inputId}-err` : undefined;
  const borderColor = error
    ? "border-mmc-error focus:border-mmc-error"
    : "border-mmc-border focus:border-mmc-dark";

  return (
    <div className={`flex flex-col gap-1 ${shake ? "mmc-shake" : ""}`}>
      <label htmlFor={inputId} className="text-sm font-medium text-mmc-text">
        {label}
        {required ? <span aria-hidden="true" className="text-mmc-error"> *</span> : null}
      </label>
      <input
        id={inputId}
        ref={ref}
        type={type}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={[helpId, errId].filter(Boolean).join(" ") || undefined}
        className={`w-full rounded-md border ${borderColor} bg-white px-4 py-3 text-mmc-text outline-none transition focus:ring-2 focus:ring-mmc-accent focus:ring-offset-2 focus:ring-offset-mmc-bg ${className}`}
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

export default TextInput;
