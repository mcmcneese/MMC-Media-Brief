"use client";

import TextInput from "./fields/TextInput";
import type { FormData } from "@/lib/types";

interface Props {
  data: FormData;
  setField: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  errors: Partial<Record<keyof FormData, string>>;
  shakeKey: number;
}

export default function ContactStep({ data, setField, errors, shakeKey }: Props) {
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
        autoComplete="email"
        data-field="contactEmail"
      />
    </div>
  );
}
