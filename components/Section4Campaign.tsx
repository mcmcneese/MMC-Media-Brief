"use client";

import TextInput from "./fields/TextInput";
import RadioGroup from "./fields/RadioGroup";
import DateInput from "./fields/DateInput";
import CurrencyInput from "./fields/CurrencyInput";
import type { FormData } from "@/lib/types";

interface Props {
  data: FormData;
  setField: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  errors: Partial<Record<keyof FormData, string>>;
  shakeKey: number;
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Section4Campaign({ data, setField, errors, shakeKey }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div data-field="primaryGoal">
        <RadioGroup
          label="Primary Campaign Goal"
          name="primaryGoal"
          options={["Brand Awareness", "Product Consideration", "Acquisition"]}
          value={data.primaryGoal}
          onChange={(v) => setField("primaryGoal", v as FormData["primaryGoal"])}
          required
          layout="vertical"
          error={errors.primaryGoal}
          shake={!!errors.primaryGoal && shakeKey > 0}
        />
      </div>

      <TextInput
        label="What KPIs will you want to use to measure campaign performance?"
        value={data.kpis}
        onChange={(e) => setField("kpis", e.target.value)}
        required
        error={errors.kpis}
        shake={!!errors.kpis && shakeKey > 0}
        data-field="kpis"
      />
      <TextInput
        label="What do you consider a successful campaign (not just KPIs, what do you want to learn from this campaign)?"
        value={data.successDefinition}
        onChange={(e) => setField("successDefinition", e.target.value)}
        required
        error={errors.successDefinition}
        shake={!!errors.successDefinition && shakeKey > 0}
        data-field="successDefinition"
      />
      <TextInput
        label="How will you track campaign success, and what technology do you have in place? (e.g., GA, HubSpot, Mixpanel)"
        value={data.trackingTech}
        onChange={(e) => setField("trackingTech", e.target.value)}
        required
        error={errors.trackingTech}
        shake={!!errors.trackingTech && shakeKey > 0}
        data-field="trackingTech"
      />
      <TextInput
        label="Does your product/service have seasonality we should be considerate of? Any times of day working best?"
        value={data.seasonality}
        onChange={(e) => setField("seasonality", e.target.value)}
        required
        error={errors.seasonality}
        shake={!!errors.seasonality && shakeKey > 0}
        data-field="seasonality"
      />
      <TextInput
        label="Any media channels you are interested in? Any to avoid?"
        value={data.channelPreferences}
        onChange={(e) => setField("channelPreferences", e.target.value)}
        required
        error={errors.channelPreferences}
        shake={!!errors.channelPreferences && shakeKey > 0}
        data-field="channelPreferences"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DateInput
          label="Campaign Start Date"
          value={data.startDate}
          min={todayIso()}
          onChange={(e) => setField("startDate", e.target.value)}
          required
          error={errors.startDate}
          shake={!!errors.startDate && shakeKey > 0}
          data-field="startDate"
        />
        <DateInput
          label="Campaign End Date"
          value={data.endDate}
          min={data.startDate || todayIso()}
          onChange={(e) => setField("endDate", e.target.value)}
          required
          error={errors.endDate}
          shake={!!errors.endDate && shakeKey > 0}
          data-field="endDate"
        />
      </div>

      <div data-field="budget">
        <CurrencyInput
          label="What is your ideal budget for this campaign?"
          value={data.budget}
          onChange={(v) => setField("budget", v)}
          required
          error={errors.budget}
          shake={!!errors.budget && shakeKey > 0}
        />
      </div>

      <div data-field="hasTVCommercial">
        <RadioGroup
          label="Do you have a television commercial available? (30s and 15s)"
          name="hasTVCommercial"
          options={["Yes", "No"]}
          value={data.hasTVCommercial}
          onChange={(v) => setField("hasTVCommercial", v as FormData["hasTVCommercial"])}
          required
          layout="horizontal"
          error={errors.hasTVCommercial}
          shake={!!errors.hasTVCommercial && shakeKey > 0}
        />
      </div>
      <div data-field="hasDisplayAds">
        <RadioGroup
          label="Do you have standard digital display ads available? (300x250, 728x90, 300x600, etc.)"
          name="hasDisplayAds"
          options={["Yes", "No"]}
          value={data.hasDisplayAds}
          onChange={(v) => setField("hasDisplayAds", v as FormData["hasDisplayAds"])}
          required
          layout="horizontal"
          error={errors.hasDisplayAds}
          shake={!!errors.hasDisplayAds && shakeKey > 0}
        />
      </div>
    </div>
  );
}
