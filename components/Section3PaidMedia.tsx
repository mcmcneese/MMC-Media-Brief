"use client";

import TextInput from "./fields/TextInput";
import RadioGroup from "./fields/RadioGroup";
import CheckboxGroup from "./fields/CheckboxGroup";
import type { FormData } from "@/lib/types";

interface Props {
  data: FormData;
  setField: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  errors: Partial<Record<keyof FormData, string>>;
  shakeKey: number;
}

const CREATIVE_OPTIONS = [
  "Linear Video",
  "CTV Video",
  "Digital Display",
  "Custom Content",
  "Social",
  "OOH",
];

export default function Section3PaidMedia({ data, setField, errors, shakeKey }: Props) {
  const showDetails = data.hasAdvertised === "Yes";

  return (
    <div className="flex flex-col gap-6">
      <div data-field="hasAdvertised">
        <RadioGroup
          label="Have you advertised in the past?"
          name="hasAdvertised"
          options={["Yes", "No"]}
          value={data.hasAdvertised}
          onChange={(v) => setField("hasAdvertised", v as FormData["hasAdvertised"])}
          required
          layout="horizontal"
          error={errors.hasAdvertised}
          shake={!!errors.hasAdvertised && shakeKey > 0}
        />
      </div>

      {showDetails ? (
        <>
          <TextInput
            label="If so, where/with what vendor? How much?"
            value={data.pastVendors}
            onChange={(e) => setField("pastVendors", e.target.value)}
            required
            error={errors.pastVendors}
            shake={!!errors.pastVendors && shakeKey > 0}
            data-field="pastVendors"
          />
          <TextInput
            label="What Worked Well?"
            value={data.whatWorked}
            onChange={(e) => setField("whatWorked", e.target.value)}
            required
            error={errors.whatWorked}
            shake={!!errors.whatWorked && shakeKey > 0}
            data-field="whatWorked"
          />
          <TextInput
            label="What Didn't Work?"
            value={data.whatDidntWork}
            onChange={(e) => setField("whatDidntWork", e.target.value)}
            required
            error={errors.whatDidntWork}
            shake={!!errors.whatDidntWork && shakeKey > 0}
            data-field="whatDidntWork"
          />
          <TextInput
            label="Where did you Advertise (Geo)?"
            value={data.pastGeo}
            onChange={(e) => setField("pastGeo", e.target.value)}
            required
            error={errors.pastGeo}
            shake={!!errors.pastGeo && shakeKey > 0}
            data-field="pastGeo"
          />
          <div data-field="pastCreative">
            <CheckboxGroup
              label="Creative Formats Used"
              helpText="Select all that apply."
              required
              options={CREATIVE_OPTIONS}
              includeOther
              value={data.pastCreative}
              onChange={(v) => setField("pastCreative", v)}
              error={errors.pastCreative}
              shake={!!errors.pastCreative && shakeKey > 0}
            />
          </div>
          <TextInput
            label="What was the goal of your past media? (KPIs, expected outcomes)"
            value={data.pastGoal}
            onChange={(e) => setField("pastGoal", e.target.value)}
            required
            error={errors.pastGoal}
            shake={!!errors.pastGoal && shakeKey > 0}
            data-field="pastGoal"
          />
        </>
      ) : null}
    </div>
  );
}
