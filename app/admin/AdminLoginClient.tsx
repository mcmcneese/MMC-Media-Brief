"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginClient() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        router.replace("/admin/dashboard");
        router.refresh();
        return;
      }
      const body = await res.json().catch(() => ({}));
      setErr(body?.message || "Incorrect password.");
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-mmc-border bg-white p-8 shadow-[0_1px_2px_rgba(42,18,48,0.04),0_12px_32px_-12px_rgba(42,18,48,0.18)] sm:p-10">
      <div className="mb-3 flex items-center justify-center">
        <span className="mmc-kicker">MMC Brief · Admin</span>
      </div>
      <h1 className="text-center text-2xl font-bold text-mmc-purple sm:text-3xl">
        Admin Sign-In
      </h1>
      <div className="mt-3 flex justify-center">
        <span className="mmc-rule" />
      </div>
      <p className="mt-5 text-center text-sm leading-relaxed text-mmc-muted">
        Enter the shared admin password to manage briefs.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <label htmlFor="adminpw" className="sr-only">
          Admin password
        </label>
        <input
          id="adminpw"
          type="password"
          autoComplete="off"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Admin password"
          aria-invalid={err ? "true" : "false"}
          aria-describedby={err ? "adminpw-err" : undefined}
          className={`w-full rounded-md border ${
            err ? "border-mmc-error" : "border-mmc-border"
          } bg-white px-4 py-3 text-mmc-text outline-none transition focus:border-mmc-purple focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-white`}
        />
        {err ? (
          <p id="adminpw-err" role="alert" className="text-sm text-mmc-error">
            {err}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy || pw.length === 0}
          className="rounded-md bg-mmc-purple px-5 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
