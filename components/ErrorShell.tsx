import Link from "next/link";
import MMCLogo from "./MMCLogo";

export default function ErrorShell({
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
