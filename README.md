# MMC Media Brief

A password-gated, mobile-responsive online intake form for **Mercurius Media Capital (MMC)**.
Prospective portfolio companies receive a link, fill out the brief in one sitting
(with save-and-resume), and on submission a Word document (`.docx`) is emailed to
MMC and offered as a download to the prospect.

---

## Tech stack

- **Framework:** Next.js 14 (App Router, TypeScript, strict mode)
- **Styling:** Tailwind CSS, Montserrat via `next/font/google`
- **Forms:** React Hook Form patterns + Zod validation
- **Document generation:** `docx` (server-side, in a Next.js API route)
- **Email delivery:** Resend (`resend` npm package)
- **Persistence:** Browser `localStorage` (no database)
- **Icons:** `lucide-react`
- **Hosting target:** Vercel

---

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file
cp .env.example .env.local
# then edit .env.local and paste in your RESEND_API_KEY

# 3. Run the dev server
npm run dev
```

Then open http://localhost:3000. The password is `ATTENTION` by default
(change it in `lib/config.ts`).

> Tip — local dev works without a Resend key. Emails will be skipped
> (a warning is logged), but the .docx is still generated and the download
> link still works.

### Preparing the Word-document logo

The `docx` package does **not** accept SVG images. A placeholder logo lives at
`public/mmc-logo.svg`; convert it (or your final logo) to a PNG before first
deploy so the letterhead block renders an image rather than the text fallback:

```bash
npx svgexport public/mmc-logo.svg public/mmc-logo.png 144:
```

Commit both files. If `public/mmc-logo.png` is missing the Word document
gracefully falls back to the text wordmark `MERCURIUS MEDIA CAPITAL`.

---

## Deployment (Vercel)

1. **Push to GitHub.** Create a new repository and push this directory.
2. **Import into Vercel.** Go to [vercel.com/new](https://vercel.com/new), pick
   the repo, and accept the defaults (Next.js is auto-detected).
3. **Add environment variables** in the Vercel project dashboard
   (Settings → Environment Variables):
   - `RESEND_API_KEY` — your Resend API key
   - `NEXT_PUBLIC_PRODUCTION_URL` — the final URL (e.g. `https://brief.mmc.us`)
4. **Custom domain.** In Settings → Domains add `brief.mmc.us`, then create a
   CNAME record at your DNS provider pointing `brief` → `cname.vercel-dns.com`.
5. **Verify the `mmc.us` sending domain in Resend.** Without this, outbound
   email from `mediastrategy@mmc.us` will land in spam. Follow
   [Resend's domain-verification guide](https://resend.com/docs/dashboard/domains/introduction)
   to add the required DNS records.
6. **Deploy.** Each push to `main` auto-deploys.

---

## Editing the form (no-developer-required)

Almost everything non-developers need to change lives in a single file:
[`lib/config.ts`](./lib/config.ts).

| What you want to change | Where |
|---|---|
| The shared password | `CONFIG.PASSWORD` |
| Who receives MMC notification emails | `CONFIG.EMAIL.mmcRecipients` |
| Who receives error alerts | `CONFIG.EMAIL.errorRecipient` |
| The "from" email address | `CONFIG.EMAIL.from` |
| Subject lines | `CONFIG.EMAIL.*Subject` |
| The prospect confirmation body | `CONFIG.PROSPECT_CONFIRMATION_BODY` (use `{{DOWNLOAD_LINK}}` token) |
| Brand colours, name, tagline, logo path | `CONFIG.BRAND.*` |
| Soft word-count limits | `CONFIG.WORD_LIMITS.*` |
| The logo image | Replace `public/mmc-logo.svg` **and** `public/mmc-logo.png` |
| Production URL in download links | `CONFIG.PRODUCTION_URL` or env var `NEXT_PUBLIC_PRODUCTION_URL` |

After editing, run `git add -A && git commit && git push` — Vercel auto-deploys
in ~30 seconds.

### Common maintenance tasks

**How do I change the password?**
Edit the `PASSWORD` field in `lib/config.ts`. Commit and push.

**How do I add another MMC recipient?**
Add their email to the `mmcRecipients` array in `lib/config.ts`:

```ts
mmcRecipients: ["matt@mmc.us", "new.person@mmc.us"],
```

**How do I update the prospect confirmation email?**
Edit `CONFIG.PROSPECT_CONFIRMATION_BODY`. Keep the `{{DOWNLOAD_LINK}}` token — it
is replaced with the actual link at send time.

**How do I swap the logo?**
Replace `public/mmc-logo.svg` with the final asset. Also regenerate the PNG
used inside the Word document (see "Preparing the Word-document logo" above).

---

## Adding / removing questions

Four changes are needed for every new question:

1. **Type** — add the field to `FormData` in [`lib/types.ts`](./lib/types.ts) and
   to the `EMPTY_FORM_DATA` default.
2. **Validation** — add the field to the Zod schema in
   [`lib/schema.ts`](./lib/schema.ts) and to the matching `STEP_FIELDS` array so
   per-step validation knows about it.
3. **UI** — render a field in the appropriate section component under
   [`components/`](./components/) (e.g. `Section1Company.tsx`).
4. **Document + Review** — add a Q&A line to
   [`lib/docx-generator.ts`](./lib/docx-generator.ts) (use the `qa()` helper)
   and a row in [`components/ReviewStep.tsx`](./components/ReviewStep.tsx).

---

## Limitations & v2 roadmap

- **In-memory download storage.** Submission .docx buffers live in server memory
  for 24 hours (see [`lib/download-store.ts`](./lib/download-store.ts)).
  If the serverless function instance cycles, a prospect's download link may
  expire early. Acceptable trade-off for v1. Upgrade path: replace with
  [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) or S3.
- **Single shared password.** A single global password, compared client-side,
  is used for all prospects. It's a deterrent, not real auth. Upgrade path:
  issue per-prospect links with a short-lived signed JWT.
- **No submissions database.** Each submission is emailed, but nothing is
  persisted beyond the 24-hour download cache. Upgrade path: append to
  Airtable / Google Sheets / a Postgres table on submit.
- **Client-side password gate.** Low-security by design — anyone determined
  enough can bypass it by reading the JS bundle.
