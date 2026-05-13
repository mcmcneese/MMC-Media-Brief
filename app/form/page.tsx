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

export default function FormPage() {
  const router = useRouter();

  // Gate mounting until we know we're unlocked (prevents flash of form).
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<FormData>(EMPTY_FORM_DATA);
  const [step, setStep] = useState<StepIndex>(0);
  const [maxVisitedStep, setMaxVisitedStep] = useState<StepIndex>(0);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  // Anchor we scroll to when leaving the hero or advancing steps.
  const formAnchorRef = useRef<HTMLDivElement | null>(null);

  const scrollToForm = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = formAnchorRef.current;
    if (!el) return;
    // Offset for the sticky header (~64px)
    const headerOffset = 72;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior });
  }, []);

  // --- Gate check + restore from localStorage ---
  useEffect(() => {
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
  }, [router]);

  // --- Debounced auto-save on data change ---
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveDraft(data), DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, ready]);

  // --- Persist step changes ---
  useEffect(() => {
    if (!ready) return;
    saveStep(step);
  }, [step, ready]);

  const setField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // --- Validation: uses full schema, then filters to fields on the current step ---
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

  // --- Navigation handlers ---
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
      // Scroll into the form region (past the hero) on every step change
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
    if (target > maxVisitedStep) return; // sidebar should already disable this; defense in depth
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
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Submission failed (${res.status})`);
      }
      const body = (await res.json()) as { success: boolean; token: string };
      clearDraft();
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
          className="h-8 w-8 animate-spin rounded-full border-2 border-mmc-border border-t-mmc-dark"
        />
      </div>
    );
  }

  const title = STEPS[step].title;
  const kicker = STEPS[step].kicker;
  const stepProps = { data, setField, errors, shakeKey };

  // Hero is only shown when the user is on the first step (Contact).
  // Once they advance, it disappears so the form is the focus.
  const hero =
    step === 0 ? <Hero onBegin={() => scrollToForm("smooth")} /> : null;

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
