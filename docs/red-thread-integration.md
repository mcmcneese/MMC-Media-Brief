# Red Thread Integration — Spec / Groundwork

Status: **Plan only.** No code yet. This documents the agreed design so it's ready to
execute once the LP data and a couple of open questions are settled.

## 1. Goal

After a prospect (pipeline/portfolio company) completes the MMC Media Brief, give Matt a
**strategy readout + LP mix + budget allocation** embedded directly in the admin brief page —
powered by a server-side port of the "Red Thread" engine.

Target flow:

> MMC talks to pipeline company (media-for-equity) → Matt creates the Groundwork brief,
> pre-filled from Granola notes → company completes the brief, Matt is notified → Matt opens
> the brief, reviews/adjusts a **Strategy Setup** panel, clicks **Generate** → Red Thread
> analyzes the brief and returns a strategy readout + budget guidance, persisted on the brief.

## 2. What Red Thread is (and why we port it, not embed it)

The existing app (https://red-thread-flax.vercel.app/) is a **client-side Vite/React SPA with
no backend**. It calls `api.anthropic.com/v1/messages` **directly from the browser**
(`anthropic-dangerous-direct-browser-access: true`, model `claude-sonnet-4-20250514`), with the
API key pasted into and stored in `localStorage`; generated strategies are saved to
`localStorage` (`red_thread_strategies`, max 50). It optionally uses Claude's web-search tool to
find real campaign precedents / real creators.

**Decision: port it server-side into this Next.js app** rather than iframe/embed it, because:
- the live app exposes the Anthropic key in the browser (security);
- we want the readout **persisted per-brief in Airtable**, not stuck in localStorage;
- we reuse our existing admin auth + server-side `ANTHROPIC_API_KEY` + Claude infra;
- we control the embedded UX.

> ⚠️ Pass to the Red Thread author: the browser-key exposure should be fixed on their side too.

## 3. Data model — two SEPARATE datasets (do not conflate)

The bundle contains both. They are different shapes and serve different roles:

- **Portfolio Companies (18)** — the equity-side brands MMC invests in; in Red Thread they're
  just a demo picker. Shape: `{ id, name, tagline, what_they_do, ... }`.
  **We do NOT need these** — our real subject company comes from the submitted brief.
- **LPs (14)** — the media-inventory partners a strategy allocates across. Shape:
  `{ id, name, short_name, type, layer, primary_media_channel[], description, reach, audience,
  content_genres[], ad_formats[], ... }`.

LP roster as found in the bundle (confirm against canonical source before build):

| Layer | LPs |
|---|---|
| LEGACY MEDIA | A+E Global Media, Atmosphere TV, Leap Media Group, National CineMedia, Sinclair Broadcast Group, TelevisaUnivision |
| NEW MEDIA | Entrepreneur Media, First Media, SWAC TV, Willow TV |
| EXPERIENTIAL | Aletheia, Denimrush Experience, MediaMint |
| MEASUREMENT | WITHIN |

Some classifications look debatable (Willow TV as "new media", WITHIN as "measurement") — verify
with the Red Thread author. **The roster will change; treat `lib/lp-network.ts` as the single
source of truth and source its contents from the author, not a stale bundle snapshot.**

### LP record additions we need (affect budget quality)
Capture these when we get the canonical LP data — the allocator must respect reality:
- **`min_spend`** — minimum viable spend per LP (you can't run NCM cinema for $5k). Prevents the
  model handing an LP an amount that can't buy anything.
- **`geo_coverage`** — national / specific DMAs / cinema or station markets.
- **`lead_time`** — some LPs need weeks; must interact with the campaign timing input so a
  long-lead LP isn't placed in a short flight.

## 4. The flow: auto-prepare, human confirms, then generate

"Auto" means auto-**prepare the inputs**, not auto-**generate**. Nothing calls Claude until Matt
confirms — controls cost and quality.

1. Prospect submits brief → Matt notified (existing behavior).
2. Matt opens the brief → **Strategy Setup** panel is pre-filled from the brief.
3. Matt reviews/adjusts (section 5) → clicks **Generate**.
4. `/api/admin/strategy` runs the engine, persists the readout JSON to Airtable.
5. Readout renders in an embedded **Strategy** panel on the brief page.
6. **Regenerate** button re-runs with adjusted inputs anytime.

> Optional toggle (decide later): also silently generate a first-draft readout on submit, while
> keeping the Setup panel for re-runs. Default for now: prepare-only, generate on click.

## 5. Strategy Setup — input contract

### 5a. Auto-pulled from the brief (no re-asking)
Audience (`targetConsumer`, `interestsAndHabits`, `additionalPersonas`), `geographicFocus`,
`businessType`, objectives (`primaryGoal`, `kpis`, `successDefinition`), `competitor1..3`, `usp`,
`differentiators`, past media (`hasAdvertised`, `pastVendors`, `whatWorked`, `whatDidntWork`,
`pastCreative`), `regulations`, `ltv`, creative-on-hand (`hasTVCommercial`, `hasDisplayAds`),
`companyName` / `companyDescription`, `budget`, `startDate` / `endDate`, `seasonality`.

### 5b. Run-time controls (editable in the panel, each pre-seeded)
Keep this tight — these are the levers that actually move the allocation:

1. **Budget** — pre-filled from `brief.budget`; editable number.
2. **Budget type + firmness** — cash vs media-for-equity value; firm number vs range (min/max).
   Decides whether output shows `$` or `%`-only and how aggressively to spread.
3. **Timing** — pre-filled from `startDate`/`endDate` + implied flight length; editable (prospects
   leave these vague). Interacts with LP `lead_time`.
4. **The single 90-day goal** — the brief may list several; Red Thread is 90-day-focused and the
   allocation hinges on one priority. Pick the lead goal.
5. **Priority markets / DMAs** — national vs specific metros. Biggest lever on *which* legacy LPs
   fit (Atmosphere = DMA, NCM = cinema markets, Sinclair = station markets).
6. **Creative appetite** — not just "have a TV spot" but budget/appetite to *produce new* creative.
   Gates the layer mix (no CTV asset + no production budget ⇒ don't allocate to CTV).
7. **Brand vs performance lean / risk appetite** — awareness-led w/ measurement reserve, or
   acquisition-led tied to LTV:CAC. Sets layer weighting.
8. **LP exclude / pin** — all 14 LPs as toggles, included by default. Exclude ones that don't fit
   (vertical, geo, brand-safety, conflict). **Pin** = force-include a specific LP (fit, or BD
   reasons — Red Thread doubles as an LP business-dev tool). Excluded IDs are filtered out of the
   dataset *before* the prompt sees them, so the model can't allocate to a ruled-out LP.
9. **Language / cultural targeting** — explicit flag (Hispanic-skewed ⇒ TelevisaUnivision becomes
   central; don't rely on inference).

### 5c. Raw context (attached silently)
Feed **`adminNotes` + the original Granola transcript/notes** into the prompt as a freeform
"context" block alongside the structured fields. The structured brief flattens nuance; the call
captures *why*. Highest-leverage quality boost and it's already on the brief.

## 6. Output / readout schema

Ported from Red Thread, plus the new budget block:
- **`audience_portraits`** — exactly 3 segments: `profile_title`, `who_they_are`,
  `how_they_discover`, `what_moves_them`.
- **`short_term_goals`**, **`long_term_goals`**.
- **`behavioral_shift`**, **`the_opportunity`**.
- **`audience_psychology`** — exactly 5 traits, each `{ trait, score 0-100, left_label,
  right_label, insight }`.
- **`strategy_rationale`** — across the 3 layers (new-media creators + legacy reach + experiential).
- **`creator_cards`** — archetypes: `archetype_name`, `tier (nano|micro|mid|macro|mega)`,
  `platform`, `follower_range`, `who_they_are`, `why_demo_trusts`, `why_moves_needle`,
  `deployment_model (mass_scale|ugc_engine|anchor|seeding|combo)`, `deployment_rationale`,
  `key_traits[3]`, `honest_caveat`, `real_world_comp`.
- **`red_threads`** — the LP mix: each thread weaves 2–3 LP nodes
  `{ lp_id, mechanism, audience_moment }` with connector labels + a `narrative`, plus a top-level
  `decision` (the through-line).
- **`success_signals`** — weekly watch metrics.
- **Roadmap** (UI): North star → Creator ignition → LP amplification → Proof & pivot.

### NEW — `budget_allocation` (net-new vs Red Thread)
Splits the Setup-panel budget:
- by **layer** (Legacy / New / Experiential / Measurement) as **% and $**;
- then by **selected LP** within each layer, each with a one-line rationale;
- a **measurement / holdout reserve** line;
- constraints: must sum to 100% / the exact budget; only allocate to LPs that appear in the red
  threads and are not excluded; respect each LP's `min_spend`; if no cash budget, output `%` only.

## 7. Architecture / files (when greenlit)

- **`lib/lp-network.ts`** — typed 14-LP dataset (single source of truth; from author).
- **`lib/strategy.ts`** — ported prompts; maps `brief.formData` + Setup inputs + raw context →
  model input; runs via server-side `ANTHROPIC_API_KEY`; returns typed readout.
- **`app/api/admin/strategy/route.ts`** — admin-only (existing auth); generates + persists readout
  to Airtable; honors exclusions/pins/budget/timing.
- **Airtable** — new long-text/JSON field (e.g. `strategyReadout`) + `strategyGeneratedAt`.
- **`BriefEditorClient`** — Strategy Setup panel + embedded readout (portraits, psychology bars,
  creator cards, red threads, roadmap, budget allocation).
- Optionally wire auto-*prep* into the post-submit view / `/api/submit`.

### Cost / latency
Large multi-section generation (+ optional web search) is too slow for one Vercel request. Plan
for streaming or a background job with a "generating…" state. Note `maxDuration` limits.

## 8. Open questions before build
1. **Canonical LP data** from the Red Thread author (roster + the `min_spend` / `geo` / `lead_time`
   fields; fix odd layer tags).
2. **Web search in or out for v1?** Out = faster/cheaper; In = real creator/comp names.
3. **Silent first-draft on submit, or generate-on-click only?** (Default: click only.)
4. **Budget when media-for-equity** (no cash number) — `%`-only output confirmed?

## 9. Build sequence (once greenlit)
1. `lib/lp-network.ts` (real LP data).
2. Strategy Setup panel (review/adjust UI).
3. `lib/strategy.ts` + prompt (budget block, honoring exclusions/pins).
4. `/api/admin/strategy` + Airtable field.
5. Embedded readout UI.
6. Wire auto-prep into post-submit view.
