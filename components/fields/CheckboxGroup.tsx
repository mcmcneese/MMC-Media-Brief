"use client";

import { useId } from "react";
import type { MultiSelectValue } from "@/lib/types";

interface CheckboxGroupProps {
  label: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  options: string[];
  includeOther?: boolean;
  value: MultiSelectValue;
  onChange: (v: MultiSelectValue) => void;
  shake?: boolean;
  /** When true, shows a gold "Needs your input" hint next to the legend. */
  needsInput?: boolean;
}

export default function CheckboxGroup({
  label,
  helpText,
  error,
  required,
  options,
  includeOther = true,
  value,
  onChange,
  shake,
  needsInput,
}: CheckboxGroupProps) {
  const reactId = useId();
  const groupId = `cg-${reactId}`;
  const helpId = helpText ? `${groupId}-help` : undefined;
  const errId = error ? `${groupId}-err` : undefined;

  const toggle = (opt: string) => {
    const isSelected = value.selected.includes(opt);
    const next = isSelected
      ? value.selected.filter((x) => x !== opt)
      : [...value.selected, opt];
    onChange({ ...value, selected: next, other: isSelected && opt === "Other" ? "" : value.other });
  };

  const onOtherText = (text: string) => {
    onChange({ ...value, other: text });
  };

  const allOpts = includeOther ? [...options, "Other"] : options;
  const otherChecked = value.selected.includes("Other");

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
      <div className="flex flex-row flex-wrap gap-2">
        {allOpts.map((opt) => {
          const checked = value.selected.includes(opt);
          const optId = `${groupId}-${opt.replace(/\s+/g, "-")}`;
          const isOther = opt === "Other";
          return (
            <div key={opt} className={isOther && otherChecked ? "flex basis-full flex-col" : ""}>
              <label htmlFor={optId} className={`tl-chip ${checked ? "tl-chip-on" : ""}`}>
                <input
                  id={optId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt)}
                  className="sr-only"
                />
                {isOther ? "Other" : opt}
              </label>
              {isOther && otherChecked ? (
                <input
                  type="text"
                  value={value.other}
                  onChange={(e) => onOtherText(e.target.value)}
                  placeholder="Please specify"
                  aria-label="Other — please specify"
                  className="mt-2 w-full rounded-[10px] border border-mmc-border bg-white px-3.5 py-[11px] text-sm text-mmc-text outline-none transition focus:border-mmc-dark focus:ring-2 focus:ring-mmc-gold focus:ring-offset-1 focus:ring-offset-white"
                />
              ) : null}
            </div>
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
