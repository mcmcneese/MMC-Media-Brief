"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { fullSchema, STEP_FIELDS } from "@/lib/schema";
import {
  clearDraft,
  isUnlocked,
  loadDraft,
  loadStep,
  saveDraft,
  saveStep,
} from "@/lib/storage";

const DEBOUNCE_MS = 500;

export interface FormClientProps {
  /**
   * Pre-populated form data from a tokenized brief (Airtable record).
   * When provided, the password gate is bypassed and the form is hydrated
   * with this data instead of localStorage.
   */
  initialData?: FormData;
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
  briefToken,
  prospectCompanyName,
}: FormClientProps) {
  const router = useRouter();

  const hasToken = Boolean(briefToken);

  // When a token is present, we don't need the password gate and we skip
  // localStorage hydration (the token's record IS the source of truth).
  // Without a token, we fall back to the existing localStorage flow.
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<FormData>(
    initialData ? { ...EMPTY_FORM_DATA, ...initialData } : EMPTY_FORM_DATA
  );
  const [step, setStep] = useState<StepIndex>(0);
  const [maxVisitedStep, setMaxVisitedStep] = useState<StepIndex>(0);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  const formAnchorRef = useRef<HTMLDivElement | null>(null);

  const scrollToForm = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = formAnchorRef.current;
    if (!el) return;
    const headerOffset = 72;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior });
  }, []);

  // --- Initial gate check + state hydration ---
  useEffect(() => {
    if (hasToken) {
      // Tokenized prospect: skip gate, initialData already in state.
      setReady(true);
      return;
    }
    if (!isUnlocked()) {
      router.replace("/");
      return;
    }
    const draft = loadDraft();
    if (draft) setData({ ...EMPTY_FORM_DATA, ...draft });
    const savedStep = loadStep();
    if (savedStep >= 0 && savedStep <= 5) {
      setStep(savedStep);
      setMaxVisitedStep(savedStep);
    }
    setReady(true);
  }, [router, hasToken]);

  // --- Debounced auto-save on data change (localStorage only — tokenized
  // briefs persist on submission, not on every keystroke) ---
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (hasToken) return; // tokenized: don't write to localStorage
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveDraft(data), DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, ready, hasToken]);

  useEffect(() => {
    if (!ready) return;
    if (hasToken) return;
    saveStep(step);
  }, [step, ready, hasToken]);

  const setField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const validateStep = useCallback(
    (current: StepIndex): boolean => {
      const result = fullSchema.safeParse(data);
      if (result.success) {
        setErrors({});
        return true;
      }
      const relevant = new Set<string>(STEP_FIELDS[current] ?? []);
      if (current === 3 && data.hasAdvertised === "No") {
        ["pastVendors", "whatWorked", "whatDidntWork", "pastGeo", "pastCreative", "pastGoal"].forEach(
          (k) => relevant.delete(k)
        );
      }
      const nextErrors: Partial<Record<keyof FormData, string>> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "") as keyof FormData;
        if (!key) continue;
        if (!relevant.has(key as string)) continue;
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return Object.keys(nextErrors).length === 0;
    },
    [data]
  );

  const focusFirstError = () => {
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (el) {
        const wrap = el.closest<HTMLElement>("[data-field]") ?? el;
        wrap.scrollIntoView({ behavior: "smooth", block: "center" });
        if ("focus" in el && typeof (el as HTMLInputElement).focus === "function") {
          try {
            (el as HTMLInputElement).focus({ preventScroll: true });
          } catch {
            /* noop */
          }
        }
      }
      setShakeKey((k) => k + 1);
    }, 0);
  };

  const advanceToStep = useCallback(
    (target: StepIndex) => {
      setStep(target);
      setMaxVisitedStep((prev) => (target > prev ? target : prev));
      setTimeout(() => scrollToForm("smooth"), 0);
    },
    [scrollToForm]
  );

  const handleNext = () => {
    if (step === 5) {
      void submit();
      return;
    }
    if (!validateStep(step)) {
      focusFirstError();
      return;
    }
    advanceToStep(Math.min(5, step + 1) as StepIndex);
  };

  const handleBack = () => {
    advanceToStep(Math.max(0, step - 1) as StepIndex);
  };

  const jumpTo = (target: StepIndex) => {
    if (target > maxVisitedStep) return;
    advanceToStep(target);
  };

  const submit = async () => {
    setSubmitError("");
    const result = fullSchema.safeParse(data);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const errKey = String(firstIssue.path[0] ?? "");
      const stepWithField = STEP_FIELDS.findIndex((fields) => fields.includes(errKey));
      const target = (stepWithField >= 0 ? stepWithField : 0) as StepIndex;
      setStep(target);
      setTimeout(() => {
        validateStep(target);
        focusFirstError();
      }, 0);
      setSubmitError("Please fix the highlighted fields before submitting.");
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
      if (!hasToken) clearDraft();
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
          maxVisitedStep={maxVisitedStep}
          onJump={jumpTo}
        />
      }
    >
      {step === 0 && <ContactStep {...stepProps} />}
      {step === 1 && <Section1Company {...stepProps} />}
      {step === 2 && <Section2Audience {...stepProps} />}
      {step === 3 && <Section3PaidMedia {...stepProps} />}
      {step === 4 && <Section4Campaign {...stepProps} />}
      {step === 5 && <ReviewStep data={data} onEdit={jumpTo} />}

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
