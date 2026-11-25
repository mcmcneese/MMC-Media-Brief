import { getBriefByToken, isAirtableConfigured } from "@/lib/airtable";
import FormClient from "./FormClient";
import ErrorShell from "@/components/ErrorShell";

// Each brief is looked up by its personal link, so we render server-side
// and never cache.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface FormPageProps {
  searchParams: { token?: string | string[] };
}

export default async function FormPage({ searchParams }: FormPageProps) {
  const tokenParam = searchParams.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  // Briefs open only from a personal link.
  if (!token) {
    return <ErrorShell
      kicker="Personal link needed"
      headline="Open your brief from your invitation"
      body="Each media brief has its own link. Please use the link in your invitation, or contact mediastrategy@mmc.us and we will send it again."
    />;
  }

  if (!isAirtableConfigured()) {
    return <ErrorShell
      kicker="Couldn't load brief"
      headline="Something went wrong"
      body="Brief records are not available right now. Please try again in a moment, or contact mediastrategy@mmc.us if the issue persists."
    />;
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
