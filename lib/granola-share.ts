// Best-effort extraction of plain text from a public Granola *share* link.
//
// Why this exists:
//   The official Granola API (lib/granola.ts) requires a Business/Enterprise
//   plan + GRANOLA_API_KEY. This module is the no-plan fallback: an admin pastes
//   a public Granola share URL and we fetch the page and strip it to text, which
//   then feeds the same Claude extraction pipeline. It also doubles as a generic
//   "fetch a URL and return readable text" helper.
//
// Reliability note: share pages can be partially client-rendered, so this is
// best-effort. The paste-raw-notes path in the UI is the 100%-reliable option.

export class ShareFetchError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ShareFetchError";
    this.status = status;
  }
}

/** True if the string looks like an http(s) URL. */
export function looksLikeUrl(value: string): boolean {
  const v = value.trim();
  if (!/^https?:\/\//i.test(v)) return false;
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch a public share URL and return its readable plain text.
 * Strips <script>/<style>, tags, and collapses whitespace.
 */
export async function fetchShareText(rawUrl: string): Promise<string> {
  const url = rawUrl.trim();
  if (!looksLikeUrl(url)) {
    throw new ShareFetchError("That doesn't look like a valid share link (expected https://…).");
  }

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MMCBriefBot/1.0; +https://mmc-media-brief.vercel.app)",
        Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
      redirect: "follow",
    });
  } catch (err) {
    throw new ShareFetchError(
      `Couldn't reach that link: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!res.ok) {
    throw new ShareFetchError(
      `The share link returned ${res.status} ${res.statusText}. Make sure it's a public link.`,
      res.status
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  const body = await res.text();

  // If the server handed back JSON (some share endpoints do), try to pull
  // obvious text fields out of it before falling back to raw stringification.
  if (contentType.includes("application/json")) {
    try {
      const json = JSON.parse(body);
      const collected = collectStrings(json).join("\n");
      const cleaned = normalizeWhitespace(collected);
      if (cleaned.length > 0) return cleaned;
    } catch {
      /* fall through to HTML stripping */
    }
  }

  return htmlToText(body);
}

/** Strip HTML to readable text. */
export function htmlToText(html: string): string {
  const withoutScripts = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ");

  const withBreaks = withoutScripts
    .replace(/<\/(p|div|br|li|h[1-6]|tr|section|article)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  const noTags = withBreaks.replace(/<[^>]+>/g, " ");

  const decoded = noTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'");

  return normalizeWhitespace(decoded);
}

function normalizeWhitespace(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t\f\v]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .trim();
}

/** Recursively collect string values from a JSON value (for JSON share endpoints). */
function collectStrings(value: unknown, depth = 0): string[] {
  if (depth > 6) return [];
  if (typeof value === "string") return value.trim() ? [value] : [];
  if (Array.isArray(value)) return value.flatMap((v) => collectStrings(v, depth + 1));
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((v) =>
      collectStrings(v, depth + 1)
    );
  }
  return [];
}
