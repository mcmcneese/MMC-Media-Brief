"use client";

import TextInput from "./fields/TextInput";
import type { FormData } from "@/lib/types";
import { isFieldEmpty } from "@/lib/form-utils";

interface Props {
  data: FormData;
  setField: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  errors: Partial<Record<keyof FormData, string>>;
  shakeKey: number;
  hasPrefill?: boolean;
}

export default function ContactStep({ data, setField, errors, shakeKey, hasPrefill }: Props) {
  const flag = (key: keyof FormData) => !!hasPrefill && isFieldEmpty(data[key]);
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-mmc-muted">
        Please provide your primary contact information so we can follow up about your brief.
      </p>
      <TextInput
        label="Primary Contact Name"
        value={data.contactName}
        onChange={(e) => setField("contactName", e.target.value)}
        required
        error={errors.contactName}
        shake={!!errors.contactName && shakeKey > 0}
        needsInput={flag("contactName")}
        autoComplete="name"
        data-field="contactName"
      />
      <TextInput
        label="Primary Contact Email"
        type="email"
        value={data.contactEmail}
        onChange={(e) => setField("contactEmail", e.target.value)}
        required
        error={errors.contactEmail}
        shake={!!errors.contactEmail && shakeKey > 0}
        needsInput={flag("contactEmail")}
        autoComplete="email"
        data-field="contactEmail"
      />
    </div>
  );
}
