import Link from "next/link";
import { getBriefByToken, isAirtableConfigured } from "@/lib/airtable";
import FormClient from "./FormClient";
import MMCLogo from "@/components/MMCLogo";

// Tokenized links can be opened without the password gate, so we render
// server-side and never cache.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface FormPageProps {
  searchParams: { token?: string | string[] };
}

export default async function FormPage({ searchParams }: FormPageProps) {
  const tokenParam = searchParams.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  // No token → existing behavior (password-gated empty form).
  if (!token) {
    return <FormClient />;
  }

  // Token present but Airtable is not configured → fall back to legacy gate
  // (we can't look the brief up). Edge case during partial setup.
  if (!isAirtableConfigured()) {
    return <FormClient />;
  }

  // Look up the brief; renders friendly error states for missing / submitted
  // / expired tokens.
  let brief: Awaited<ReturnType<typeof getBriefByToken>> = null;
  let lookupError = false;
  try {
    brief = await getBriefByToken(token);
  } catch (err) {
    console.error("[/form] Airtable lookup failed:", err);
    lookupError = true;
  }

  if (lookupError) {
    return <ErrorShell
      kicker="Couldn't load brief"
      headline="Something went wrong"
      body="We had trouble retrieving your brief from our records. Please try again in a moment, or contact mediastrategy@mmc.us if the issue persists."
    />;
  }

  if (!brief) {
    return <ErrorShell
      kicker="Link not found"
      headline="This brief link is invalid"
      body="The link you used does not match an active brief in our records. Please double-check the URL in your invitation email, or contact mediastrategy@mmc.us for a fresh link."
    />;
  }

  if (brief.status === "Expired") {
    return <ErrorShell
      kicker="Link expired"
      headline="This brief link has expired"
      body="Your invitation has expired. Please contact mediastrategy@mmc.us to request a new link."
    />;
  }

  if (brief.status === "Submitted") {
    return <ErrorShell
      kicker="Already Submitted"
      headline="Your brief has been received"
      body="This brief was already submitted. Our team is reviewing it and will reach out shortly. If you need to make changes, please email mediastrategy@mmc.us."
    />;
  }

  // Brief is in Draft or Sent state — render the form, pre-filled from
  // Airtable, with no password gate.
  return (
    <FormClient
      initialData={brief.formData}
      briefToken={brief.token}
      prospectCompanyName={brief.companyName || undefined}
    />
  );
}

function ErrorShell({
  kicker,
  headline,
  body,
}: {
  kicker: string;
  headline: string;
  body: string;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-mmc-border/70 bg-mmc-cream/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <MMCLogo height={56} priority />
          <span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-mmc-gold md:block">
            Media Brief
          </span>
          <span />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-4 py-16 sm:px-6">
        <div className="w-full rounded-lg border border-mmc-border bg-white p-8 text-center shadow-[0_1px_2px_rgba(42,18,48,0.04),0_12px_32px_-12px_rgba(42,18,48,0.18)] sm:p-10">
          <div className="mb-2 flex items-center justify-center">
            <span className="mmc-kicker">{kicker}</span>
          </div>
          <h1 className="text-2xl font-bold text-mmc-purple sm:text-3xl">{headline}</h1>
          <div className="mt-3 flex justify-center">
            <span className="mmc-rule" />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-mmc-muted">{body}</p>
          <Link
            href="mailto:mediastrategy@mmc.us"
            className="mt-7 inline-flex items-center justify-center rounded-md bg-mmc-purple px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:brightness-110"
          >
            Contact MMC
          </Link>
        </div>
      </main>
    </div>
  );
}
