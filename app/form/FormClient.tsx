"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FormShell from "@/components/FormShell";
import Hero from "@/components/Hero";
import Sidebar from "@/components/Sidebar";
import ContactStep from "@/components/ContactStep";
import Section1Company from "@/components/Section1Company";
import Section2Audience from "@/components/Section2Audience";
import Section3PaidMedia from "@/components/Section3PaidMedia";
import Section4Campaign from "@/components/Section4Campaign";
import ReviewStep from "@/components/ReviewStep";
import { EMPTY_FORM_DATA, STEPS, type FormData, type StepIndex } from "@/lib/types";
import { fullSchema, incompleteFieldsByStep } from "@/lib/schema";

const SAVE_DELAY_MS = 1500;

export interface FormClientProps {
  /**
   * Pre-populated form data from a tokenized brief (Airtable record).
   * When provided, the password gate is bypassed and the form is hydrated
   * with this data instead of localStorage.
   */
  initialData?: FormData;
  /** The step the company was on when their progress was last saved. */
  initialStep?: number;
  /** A look at the brief by the team: nothing is tracked, saved or submitted. */
  preview?: boolean;
  /**
   * The brief token (Airtable record identifier) for the prospect.
   * When provided, submission updates that Airtable record instead of just
   * generating a one-off brief.
   */
  briefToken?: string;
  /**
   * Company name used to personalize the hero. Optional — falls back to the
   * generic hero copy when absent.
   */
  prospectCompanyName?: string;
}

export default function FormClient({
  initialData,
  initialStep,
  preview = false,
  briefToken,
  prospectCompanyName,
}: FormClientProps) {
  const router = useRouter();

  const hasToken = Boolean(briefToken);

  const [ready, setReady] = useState(false);
  const [data, setData] = useState<FormData>(
    initialData ? { ...EMPTY_FORM_DATA, ...initialData } : EMPTY_FORM_DATA
  );
  const [step, setStep] = useState<StepIndex>(
    typeof initialStep === "number" && initialStep >= 0 && initialStep <= 5 ? (initialStep as StepIndex) : 0
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  const formAnchorRef = useRef<HTMLDivElement | null>(null);
  const submitted = useRef(false);

  const scrollToForm = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = formAnchorRef.current;
    if (!el) return;
    const headerOffset = 72;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior });
  }, []);

  // --- Initial gate check + state hydration ---
  useEffect(() => {
    // The form only renders for a valid personal link; its record is the
    // source of truth, so there is nothing to unlock or hydrate here.
    setReady(true);
  }, []);

  // --- Tracking and saved progress, kept on the brief's own record ---
  const post = useCallback(
    (payload: Record<string, unknown>, keepalive = false) =>
      fetch("/api/brief/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefToken, ...payload }),
        keepalive,
      }).catch(() => undefined),
    [briefToken]
  );

  // First open, recorded from the browser so link previews do not count.
  useEffect(() => {
    if (!hasToken || preview) return;
    void post({ event: "opened" });
  }, [hasToken, preview, post]);

  // Save shortly after the company changes an answer or moves section, and
  // once more as they leave the page. Nothing is saved until they change
  // something, so opening a brief never counts as starting it.
  const dirty = useRef(false);
  const latest = useRef({ data, step });
  latest.current = { data, step };
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!ready || !hasToken || preview || !dirty.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void post({ event: "save", data, step });
    }, SAVE_DELAY_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, step, ready, hasToken, preview, post]);

  useEffect(() => {
    if (!hasToken || preview) return;
    const flush = () => {
      if (!dirty.current || submitted.current) return;
      void post({ event: "save", data: latest.current.data, step: latest.current.step }, true);
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [hasToken, preview, post]);


  const setField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    dirty.current = true;
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // Non-blocking completeness: which content sections still have required
  // fields missing. Navigation is never gated on this — it only drives the
  // sidebar status markers and the pre-submit reminder on the Review step.
  const incompleteByStep = useMemo(() => incompleteFieldsByStep(data), [data]);

  const advanceToStep = useCallback(
    (target: StepIndex) => {
      setStep(target);
      setTimeout(() => scrollToForm("smooth"), 0);
    },
    [scrollToForm]
  );

  const handleNext = () => {
    if (step === 5) {
      void submit();
      return;
    }
    // Free navigation: advancing is never blocked on completion.
    advanceToStep(Math.min(5, step + 1) as StepIndex);
  };

  const handleBack = () => {
    advanceToStep(Math.max(0, step - 1) as StepIndex);
  };

  // Jump to ANY section at any time, regardless of completion.
  const jumpTo = (target: StepIndex) => {
    advanceToStep(target);
  };

  const submit = async () => {
    if (preview) {
      setSubmitError("This is a preview. Nothing is saved or submitted from here.");
      return;
    }
    setSubmitError("");
    const result = fullSchema.safeParse(data);
    if (!result.success) {
      // Non-blocking philosophy: don't yank the prospect around. Keep them on
      // the Review step, highlight every incomplete field (so markers are in
      // place when they jump into a section), and surface the reminder panel.
      const allErrors: Partial<Record<keyof FormData, string>> = {};
      const skipPastMedia = data.hasAdvertised === "No";
      const pastMediaFields = [
        "pastVendors",
        "whatWorked",
        "whatDidntWork",
        "pastGeo",
        "pastCreative",
        "pastGoal",
      ];
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "") as keyof FormData;
        if (!key) continue;
        if (skipPastMedia && pastMediaFields.includes(key as string)) continue;
        if (!allErrors[key]) allErrors[key] = issue.message;
      }
      setErrors(allErrors);
      setStep(5);
      setSubmitError(
        "Some required details are still incomplete. Complete the highlighted items below, then submit. Nothing is locked — you can jump to any section."
      );
      setTimeout(() => {
        const panel = document.getElementById("incomplete-reminder");
        if (panel) panel.scrollIntoView({ behavior: "smooth", block: "center" });
        setShakeKey((k) => k + 1);
      }, 0);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Include briefToken so the server can update the matching Airtable
        // record (status → Submitted, formData saved, submittedAt set).
        body: JSON.stringify({ ...data, briefToken: briefToken ?? undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Submission failed (${res.status})`);
      }
      const body = (await res.json()) as {
        success: boolean;
        token: string;
        filename?: string;
        docxBase64?: string;
      };
      if (body.docxBase64 && body.filename) {
        try {
          sessionStorage.setItem(
            `mmc_brief_docx_${body.token}`,
            JSON.stringify({ filename: body.filename, base64: body.docxBase64 })
          );
        } catch {
          /* noop */
        }
      }
      submitted.current = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      router.push(`/success?token=${encodeURIComponent(body.token)}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again in a moment."
      );
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mmc-bg">
        <div
          aria-label="Loading"
          className="h-8 w-8 animate-spin rounded-full border-2 border-mmc-border border-t-mmc-purple"
        />
      </div>
    );
  }

  const title = STEPS[step].title;
  const kicker = STEPS[step].kicker;
  const hasPrefill = hasToken;
  const stepProps = { data, setField, errors, shakeKey, hasPrefill };

  const hero =
    step === 0 ? (
      <Hero
        onBegin={() => scrollToForm("smooth")}
        prospectCompanyName={prospectCompanyName}
        hasPrefill={hasPrefill}
      />
    ) : null;

  return (
    <FormShell
      step={step}
      title={title}
      kicker={kicker}
      onBack={step === 0 ? undefined : handleBack}
      onNext={handleNext}
      nextLabel={step === 5 ? "Submit Brief" : "Continue"}
      isSubmitting={submitting}
      hero={hero}
      formAnchorRef={formAnchorRef}
      sidebar={
        <Sidebar
          currentStep={step}
          onJump={jumpTo}
          incompleteSteps={Object.keys(incompleteByStep).map(Number)}
        />
      }
    >
      {step === 0 && <ContactStep {...stepProps} />}
      {step === 1 && <Section1Company {...stepProps} />}
      {step === 2 && <Section2Audience {...stepProps} />}
      {step === 3 && <Section3PaidMedia {...stepProps} />}
      {step === 4 && <Section4Campaign {...stepProps} />}
      {step === 5 && (
        <ReviewStep data={data} onEdit={jumpTo} incompleteByStep={incompleteByStep} />
      )}

      {submitError ? (
        <div
          role="alert"
          className="mt-6 rounded-md border border-mmc-error/30 bg-mmc-error/5 p-4 text-sm text-mmc-error"
        >
          {submitError}
        </div>
      ) : null}
    </FormShell>
  );
}
