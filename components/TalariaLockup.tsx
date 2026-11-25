import { BANDS_HTML, LOCKUP_HTML } from "@/lib/brand-art";

/** The Talaria wordmark with its byline. */
export default function TalariaLockup() {
  return (
    <div className="flex flex-col gap-2" role="img" aria-label="Talaria, by Mercurius Venture Capital">
      <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: LOCKUP_HTML }} />
      <span aria-hidden="true" className="tl-label !text-[#4A4F58]">By Mercurius Venture Capital</span>
    </div>
  );
}

/** The ribbon and wing that sit at the foot of the page. */
export function TalariaBands() {
  return <div className="tl-bands" dangerouslySetInnerHTML={{ __html: BANDS_HTML }} />;
}
