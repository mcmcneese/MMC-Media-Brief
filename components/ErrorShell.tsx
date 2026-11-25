import Link from "next/link";
import TalariaLockup, { TalariaBands } from "./TalariaLockup";

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
    <div className="flex min-h-screen flex-col items-center px-4">
      <header className="flex w-full max-w-[760px] items-end gap-4 pb-[22px] pt-9">
        <TalariaLockup />
        <span className="flex-grow" />
        <span className="text-[15px] font-semibold">Media brief</span>
      </header>
      <main className="flex w-full max-w-[760px] flex-col items-start gap-4 rounded-3xl bg-white px-5 py-7 sm:px-9 sm:py-8">
        <span className="tl-label">{kicker}</span>
        <h1 className="text-[26px] font-semibold leading-8 tracking-[-0.02em]">{headline}</h1>
        <p className="max-w-[560px] text-[15px] leading-6 text-mmc-muted">{body}</p>
        <Link href="mailto:mediastrategy@mmc.us" className="tl-btn mt-1">
          Contact MMC
        </Link>
      </main>
      <div className="w-full flex-grow" />
      <div className="-mx-4 w-[calc(100%+2rem)]">
        <TalariaBands />
      </div>
    </div>
  );
}
