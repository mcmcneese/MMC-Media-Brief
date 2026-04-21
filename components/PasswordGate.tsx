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
    // Low-security client-side check (spec §4)
    if (pw === CONFIG.PASSWORD) {
      setUnlocked();
      router.push("/form");
    } else {
      setErr("Incorrect access code. Please check your invitation email.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-mmc-bg px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-mmc-border bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <MMCLogo height={48} priority />
        </div>
        <h1 className="text-center text-xl font-semibold text-mmc-text">MMC Media Brief</h1>
        <p className="mt-2 text-center text-sm text-mmc-muted">
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
            } bg-white px-4 py-3 text-mmc-text outline-none transition focus:border-mmc-dark focus:ring-2 focus:ring-mmc-accent focus:ring-offset-2 focus:ring-offset-white`}
          />
          {err ? (
            <p id="pw-err" role="alert" className="text-sm text-mmc-error">
              {err}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy || pw.length === 0}
            className="rounded-md bg-mmc-accent px-5 py-3 text-sm font-semibold text-mmc-dark transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-mmc-dark focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
