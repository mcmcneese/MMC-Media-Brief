"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import MMCLogo from "./MMCLogo";

interface AdminHeaderProps {
  /** Show the sign-out button. Defaults to true on authenticated pages. */
  showSignOut?: boolean;
}

export default function AdminHeader({ showSignOut = true }: AdminHeaderProps) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 w-full border-b border-mmc-border/70 bg-mmc-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <MMCLogo height={64} priority />
        </Link>
        <div className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-mmc-gold md:block">
          Brief Admin
        </div>
        <div className="flex items-center gap-2">
          {showSignOut ? (
            <button
              type="button"
              onClick={signOut}
              className="rounded-md border border-mmc-border bg-white/60 px-3.5 py-1.5 text-xs font-medium text-mmc-text transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-mmc-cream"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
