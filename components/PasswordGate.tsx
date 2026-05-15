"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import MMCLogo from "./MMCLogo";
import { CONFIG } from "@/lib/config";
import { setUnlocked } from "@/lib/storage";

export default function PasswordGate() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

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
        <div className="mb-6 flex justify-center">
          <MMCLogo height={112} priority />
        </div>

        <p className="text-center text-[12px] italic leading-snug tracking-tight text-mmc-muted sm:whitespace-nowrap">
          Please enter the access code provided in your invitation email.
        </p>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4" noValidate>
          <label htmlFor="pw" className="sr-only">
            Access code
          </label>
          <div className="relative">
            <input
              id="pw"
              type={show ? "text" : "password"}
              autoComplete="off"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Access code"
              aria-invalid={err ? "true" : "false"}
              aria-describedby={err ? "pw-err" : undefined}
              className={`w-full rounded-md border ${
                err ? "border-mmc-error" : "border-mmc-border"
              } bg-white px-4 py-3 pr-12 text-mmc-text outline-none transition focus:border-mmc-purple focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-white`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide access code" : "Show access code"}
              aria-pressed={show}
              className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-mmc-muted transition hover:bg-mmc-cream hover:text-mmc-text focus:outline-none focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-white"
            >
              {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </button>
          </div>
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

        {/* MMC team admin entry — subtle, below the prospect form */}
        <div className="mt-6 border-t border-mmc-border/60 pt-4 text-center">
          <Link
            href="/admin"
            className="text-xs font-medium text-mmc-muted underline decoration-mmc-gold/50 decoration-2 underline-offset-4 transition hover:text-mmc-purple hover:decoration-mmc-gold focus:outline-none focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-white"
          >
            MMC team? Sign in to admin →
          </Link>
        </div>
      </div>
    </div>
  );
}
