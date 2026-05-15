"use client";

import TextInput from "./fields/TextInput";
import TextArea from "./fields/TextArea";
import RadioGroup from "./fields/RadioGroup";
import type { FormData } from "@/lib/types";
import { CONFIG } from "@/lib/config";
import { isFieldEmpty } from "@/lib/form-utils";

interface Props {
  data: FormData;
  setField: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  errors: Partial<Record<keyof FormData, string>>;
  shakeKey: number;
  hasPrefill?: boolean;
}

export default function Section2Audience({ data, setField, errors, shakeKey, hasPrefill }: Props) {
  const flag = (key: keyof FormData) => !!hasPrefill && isFieldEmpty(data[key]);
  return (
    <div className="flex flex-col gap-6">
      <TextInput
        label="Who do you consider your target consumer? What is their Age, Gender, average HHI?"
        value={data.targetConsumer}
        onChange={(e) => setField("targetConsumer", e.target.value)}
        required
        error={errors.targetConsumer}
        shake={!!errors.targetConsumer && shakeKey > 0}
        needsInput={flag("targetConsumer")}
        data-field="targetConsumer"
      />
      <div data-field="businessType">
        <RadioGroup
          label="Business Type"
          name="businessType"
          options={["B2B", "B2C", "Mix of both"]}
          value={data.businessType}
          onChange={(v) => setField("businessType", v as FormData["businessType"])}
          required
          layout="horizontal"
          error={errors.businessType}
          shake={!!errors.businessType && shakeKey > 0}
          needsInput={flag("businessType")}
        />
      </div>
      <TextInput
        label="Is there a Geographic focus?"
        value={data.geographicFocus}
        onChange={(e) => setField("geographicFocus", e.target.value)}
        required
        error={errors.geographicFocus}
        shake={!!errors.geographicFocus && shakeKey > 0}
        needsInput={flag("geographicFocus")}
        data-field="geographicFocus"
      />
      <TextInput
        label="What are their interests and purchase habits?"
        value={data.interestsAndHabits}
        onChange={(e) => setField("interestsAndHabits", e.target.value)}
        required
        error={errors.interestsAndHabits}
        shake={!!errors.interestsAndHabits && shakeKey > 0}
        needsInput={flag("interestsAndHabits")}
        data-field="interestsAndHabits"
      />
      <TextArea
        label="Do you have any additional audience personas we should be considerate of?"
        value={data.additionalPersonas}
        onChange={(e) => setField("additionalPersonas", e.target.value)}
        required
        rows={4}
        wordLimit={CONFIG.WORD_LIMITS.additionalPersonas}
        error={errors.additionalPersonas}
        shake={!!errors.additionalPersonas && shakeKey > 0}
        needsInput={flag("additionalPersonas")}
        data-field="additionalPersonas"
      />
    </div>
  );
}
