"use client";

import type { FormData, MultiSelectValue, StepIndex } from "@/lib/types";

interface Props {
  data: FormData;
  onEdit: (step: StepIndex) => void;
}

function fmtCurrency(n: number | null): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return "$" + Math.round(n).toLocaleString("en-US");
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function fmtMulti(v: MultiSelectValue): string {
  const items = v.selected.filter((x) => x !== "Other");
  if (v.selected.includes("Other")) {
    items.push(v.other.trim() ? `Other: ${v.other.trim()}` : "Other");
  }
  return items.length === 0 ? "—" : items.join(", ");
}

function Row({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-mmc-border py-3 last:border-b-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-mmc-muted">{q}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-mmc-text">
        {a && a.trim() !== "" ? a : "—"}
      </dd>
    </div>
  );
}

function Section({
  title,
  stepIndex,
  onEdit,
  children,
}: {
  title: string;
  stepIndex: StepIndex;
  onEdit: (step: StepIndex) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-baseline justify-between gap-4 border-b border-mmc-border pb-1">
        <h2 className="text-base font-semibold text-mmc-text">{title}</h2>
        <button
          type="button"
          onClick={() => onEdit(stepIndex)}
          className="text-xs font-medium text-mmc-dark underline decoration-mmc-accent decoration-2 underline-offset-4 hover:text-mmc-accent"
        >
          Edit
        </button>
      </div>
      <dl>{children}</dl>
    </section>
  );
}

export default function ReviewStep({ data, onEdit }: Props) {
  return (
    <div>
      <p className="mb-6 text-sm text-mmc-muted">
        Please review the details below. Use the Edit links to jump back and make changes — your
        data is preserved.
      </p>

      <Section title="Contact" stepIndex={0} onEdit={onEdit}>
        <Row q="Primary Contact Name" a={data.contactName} />
        <Row q="Primary Contact Email" a={data.contactEmail} />
      </Section>

      <Section title="Section 1 — Company Information" stepIndex={1} onEdit={onEdit}>
        <Row q="Company Name" a={data.companyName} />
        <Row q="Company Website" a={data.companyWebsite} />
        <Row q="Company Description" a={data.companyDescription} />
        <Row q="USP" a={data.usp} />
        <Row q="Market Differentiators" a={data.differentiators} />
        <Row
          q="Top Competitors"
          a={[data.competitor1, data.competitor2, data.competitor3]
            .map((c, i) => `${i + 1}. ${c || "—"}`)
            .join("\n")}
        />
        <Row q="Pricing" a={data.pricing} />
        <Row q="Availability" a={data.availability} />
        <Row q="Advertising Regulations" a={fmtMulti(data.regulations)} />
        <Row q="Current LTV (or goal LTV)" a={fmtCurrency(data.ltv)} />
      </Section>

      <Section title="Section 2 — Audience Details" stepIndex={2} onEdit={onEdit}>
        <Row q="Target Consumer" a={data.targetConsumer} />
        <Row q="Business Type" a={data.businessType || "—"} />
        <Row q="Geographic Focus" a={data.geographicFocus} />
        <Row q="Interests and Purchase Habits" a={data.interestsAndHabits} />
        <Row q="Additional Personas" a={data.additionalPersonas} />
      </Section>

      <Section title="Section 3 — Past and Present Paid Media" stepIndex={3} onEdit={onEdit}>
        <Row q="Have you advertised in the past?" a={data.hasAdvertised || "—"} />
        {data.hasAdvertised === "Yes" ? (
          <>
            <Row q="Past Vendors / Spend" a={data.pastVendors} />
            <Row q="What Worked Well" a={data.whatWorked} />
            <Row q="What Didn't Work" a={data.whatDidntWork} />
            <Row q="Geography" a={data.pastGeo} />
            <Row q="Creative Formats Used" a={fmtMulti(data.pastCreative)} />
            <Row q="Goal of Past Media" a={data.pastGoal} />
          </>
        ) : data.hasAdvertised === "No" ? (
          <div className="py-2 text-xs italic text-mmc-muted">
            No prior paid media activity reported.
          </div>
        ) : null}
      </Section>

      <Section title="Section 4 — MMC Campaign Set Up" stepIndex={4} onEdit={onEdit}>
        <Row q="Primary Campaign Goal" a={data.primaryGoal || "—"} />
        <Row q="KPIs" a={data.kpis} />
        <Row q="Definition of Success" a={data.successDefinition} />
        <Row q="Tracking Technology" a={data.trackingTech} />
        <Row q="Seasonality" a={data.seasonality} />
        <Row q="Channel Preferences" a={data.channelPreferences} />
        <Row q="Start Date" a={fmtDate(data.startDate)} />
        <Row q="End Date" a={fmtDate(data.endDate)} />
        <Row q="Ideal Budget" a={fmtCurrency(data.budget)} />
        <Row q="TV Commercial Available" a={data.hasTVCommercial || "—"} />
        <Row q="Display Ads Available" a={data.hasDisplayAds || "—"} />
      </Section>
    </div>
  );
}
