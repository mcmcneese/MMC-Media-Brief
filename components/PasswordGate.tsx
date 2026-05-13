"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import MMCLogo from "./MMCLogo";
import { CONFIG } from "@/lib/config";
import { setUnlocked } from "@/lib/storage";

export default function PasswordGate() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    if (pw === CONFIG.PASSWORD) {
      setUnlocked();
      router.push("/form");
    } else {
      setErr("Incorrect access code. Please check your invitation email.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-mmc-border bg-white p-8 shadow-[0_1px_2px_rgba(42,18,48,0.04),0_12px_32px_-12px_rgba(42,18,48,0.18)] sm:p-10">
        <div className="mb-7 flex justify-center">
          <MMCLogo height={80} priority />
        </div>

        {/* Kicker + rule */}
        <div className="mb-3 flex items-center justify-center gap-3">
          <span className="mmc-kicker">Media Brief · 2026</span>
        </div>
        <h1 className="text-center text-2xl font-bold text-mmc-purple sm:text-3xl">
          Welcome
        </h1>
        <div className="mt-3 flex justify-center">
          <span className="mmc-rule" />
        </div>
        <p className="mt-5 text-center text-sm leading-relaxed text-mmc-muted">
          Please enter the access code provided in your invitation email.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <label htmlFor="pw" className="sr-only">
            Access code
          </label>
          <input
            id="pw"
            type="password"
            autoComplete="off"
            autoFocus
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Access code"
            aria-invalid={err ? "true" : "false"}
            aria-describedby={err ? "pw-err" : undefined}
            className={`w-full rounded-md border ${
              err ? "border-mmc-error" : "border-mmc-border"
            } bg-white px-4 py-3 text-mmc-text outline-none transition focus:border-mmc-purple focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-white`}
          />
          {err ? (
            <p id="pw-err" role="alert" className="text-sm text-mmc-error">
              {err}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy || pw.length === 0}
            className="rounded-md bg-mmc-purple px-5 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
