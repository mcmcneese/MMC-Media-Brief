// In-memory download store.
//
// LIMITATION: Downloads are served from in-memory storage. If serverless function
// instances cycle, the download link may expire early. Acceptable trade-off for v1 —
// upgrade to Vercel Blob / S3 in v2 if needed.
//
// The store is keyed by token (crypto.randomUUID()) and each entry expires after
// 24 hours. Cleanup is handled by a setTimeout per entry.

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export interface DownloadEntry {
  buffer: Buffer;
  filename: string;
  createdAt: number;
}

// Use a global symbol so hot-reloading in dev doesn't clear the store between requests.
// In a single serverless cold/warm cycle this is just a Map instance.
const GLOBAL_KEY = Symbol.for("mmc.brief.downloadStore");

interface GlobalStore {
  [GLOBAL_KEY]?: Map<string, DownloadEntry>;
}

const globalStore = globalThis as unknown as GlobalStore;
if (!globalStore[GLOBAL_KEY]) {
  globalStore[GLOBAL_KEY] = new Map<string, DownloadEntry>();
}
const store = globalStore[GLOBAL_KEY]!;

export function putDownload(token: string, buffer: Buffer, filename: string): void {
  store.set(token, { buffer, filename, createdAt: Date.now() });
  setTimeout(() => {
    store.delete(token);
  }, TWENTY_FOUR_HOURS_MS).unref?.();
}

export function getDownload(token: string): DownloadEntry | null {
  const entry = store.get(token);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > TWENTY_FOUR_HOURS_MS) {
    store.delete(token);
    return null;
  }
  return entry;
}
