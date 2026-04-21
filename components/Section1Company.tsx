"use client";

import TextInput from "./fields/TextInput";
import TextArea from "./fields/TextArea";
import CurrencyInput from "./fields/CurrencyInput";
import CheckboxGroup from "./fields/CheckboxGroup";
import type { FormData } from "@/lib/types";
import { CONFIG } from "@/lib/config";

interface Props {
  data: FormData;
  setField: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  errors: Partial<Record<keyof FormData, string>>;
  shakeKey: number;
}

const REGULATION_OPTIONS = [
  "Health/medical claims",
  "Financial services",
  "Alcohol",
  "Cannabis/CBD",
  "Supplements",
  "Political",
  "Gambling",
  "Children's products",
  "None",
];

export default function Section1Company({ data, setField, errors, shakeKey }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <TextInput
        label="Company Name"
        value={data.companyName}
        onChange={(e) => setField("companyName", e.target.value)}
        required
        error={errors.companyName}
        shake={!!errors.companyName && shakeKey > 0}
        data-field="companyName"
      />
      <TextInput
        label="Company Website"
        type="url"
        value={data.companyWebsite}
        onChange={(e) => setField("companyWebsite", e.target.value)}
        required
        placeholder="https://example.com"
        error={errors.companyWebsite}
        shake={!!errors.companyWebsite && shakeKey > 0}
        data-field="companyWebsite"
      />
      <TextArea
        label="Tell Us About Your Company"
        value={data.companyDescription}
        onChange={(e) => setField("companyDescription", e.target.value)}
        required
        rows={4}
        wordLimit={CONFIG.WORD_LIMITS.companyDescription}
        error={errors.companyDescription}
        shake={!!errors.companyDescription && shakeKey > 0}
        data-field="companyDescription"
      />
      <TextArea
        label="What is your USP? (Unique Selling Proposition)"
        value={data.usp}
        onChange={(e) => setField("usp", e.target.value)}
        required
        rows={3}
        wordLimit={CONFIG.WORD_LIMITS.usp}
        error={errors.usp}
        shake={!!errors.usp && shakeKey > 0}
        data-field="usp"
      />
      <TextArea
        label="What Are Your Market Differentiators? What Makes You Different than your competitors?"
        value={data.differentiators}
        onChange={(e) => setField("differentiators", e.target.value)}
        required
        rows={5}
        wordLimit={CONFIG.WORD_LIMITS.differentiators}
        error={errors.differentiators}
        shake={!!errors.differentiators && shakeKey > 0}
        data-field="differentiators"
      />

      <div>
        <div className="mb-2 text-sm font-medium text-mmc-text">
          Top Competitors <span aria-hidden="true" className="text-mmc-error">*</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextInput
            label="Competitor 1"
            value={data.competitor1}
            onChange={(e) => setField("competitor1", e.target.value)}
            required
            error={errors.competitor1}
            shake={!!errors.competitor1 && shakeKey > 0}
            data-field="competitor1"
          />
          <TextInput
            label="Competitor 2"
            value={data.competitor2}
            onChange={(e) => setField("competitor2", e.target.value)}
            required
            error={errors.competitor2}
            shake={!!errors.competitor2 && shakeKey > 0}
            data-field="competitor2"
          />
          <TextInput
            label="Competitor 3"
            value={data.competitor3}
            onChange={(e) => setField("competitor3", e.target.value)}
            required
            error={errors.competitor3}
            shake={!!errors.competitor3 && shakeKey > 0}
            data-field="competitor3"
          />
        </div>
      </div>

      <TextInput
        label="How much does your product/service cost? Are there different prices? (If so, please provide a range from Low–High)"
        value={data.pricing}
        onChange={(e) => setField("pricing", e.target.value)}
        required
        error={errors.pricing}
        shake={!!errors.pricing && shakeKey > 0}
        data-field="pricing"
      />
      <TextInput
        label="Where can your product/service be purchased or delivered? (e.g., National, Regional, online only, in-store)"
        value={data.availability}
        onChange={(e) => setField("availability", e.target.value)}
        required
        error={errors.availability}
        shake={!!errors.availability && shakeKey > 0}
        data-field="availability"
      />
      <div data-field="regulations">
        <CheckboxGroup
          label="Is your category subject to any advertising regulations or restrictions?"
          helpText="Select all that apply."
          required
          options={REGULATION_OPTIONS}
          includeOther
          value={data.regulations}
          onChange={(v) => setField("regulations", v)}
          error={errors.regulations}
          shake={!!errors.regulations && shakeKey > 0}
        />
      </div>
      <div data-field="ltv">
        <CurrencyInput
          label="What is your company's current LTV? If you don't have one accessible, do you have a goal LTV?"
          value={data.ltv}
          onChange={(v) => setField("ltv", v)}
          required
          error={errors.ltv}
          shake={!!errors.ltv && shakeKey > 0}
        />
      </div>
    </div>
  );
}
