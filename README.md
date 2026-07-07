# Wizarding Portfolio — Phoebe Rhone Gangoso

A Harry Potter–themed portfolio for an **AI Engineering** career target. The signature
feature is an AI **"Sorting Hat"** that answers questions about Phoebe's work via
retrieval-augmented generation (RAG) over her resume + project write-ups, set inside an
interactive 3D castle that serves as the navigation.

> **Guiding principle:** the theme is a wrapper; the substance is real. Projects, resume,
> and contact stay fast, scannable, and accessible — a recruiter has ~30 seconds.

**Phases 0–2 plus a content pass are live:** the shippable content site, the interactive 3D
castle navigation hub (React Three Fiber), a fleshed-out **Great Hall** (bio, Tech Stack,
Experience, and a 3D "Daily Prophet" featured section), and **seven real projects** that link
out to their live sites. The **"Ask the Sorting Hat" RAG chat is live** (Gemini + a local
embedded index — see [Sorting Hat (RAG)](#sorting-hat-rag)); "Get Sorted" (`/api/sort`) and
the atmosphere effects (Phase 4) remain clean, typed **stubs**.

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build (also generates Contentlayer + lints + typechecks)
npm run start        # serve the production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run format       # Prettier (write)
```

No API keys are required to run the site locally. The AI and email features are stubbed (see
[Environment](#environment-variables)).

---

## What's done (Phases 0–2 + content)

**Phase 0 — scaffold**

- Next.js 14 (App Router) + TypeScript + ESLint + Prettier.
- Tailwind CSS **v3** with the full Wizarding design system ported in:
  - All `:root` tokens + the four `[data-house="…"]` theme blocks in
    [`app/globals.css`](app/globals.css) — ported from `docs/Wizarding Design System.html`
    (the single source of truth).
  - Tokens mirrored into [`tailwind.config.ts`](tailwind.config.ts) so utilities like
    `bg-surface`, `text-accent-text`, `shadow-glow`, `ease-float`, `rounded-pill` map to
    the tokens — plus shadcn/ui-compatible semantic aliases (`primary`, `card`, `ring`…).
- Four fonts via `next/font`: **Cinzel** (display), **Cormorant Garamond** (serif),
  **Inter** (body/UI), **JetBrains Mono** (mono) — see [`app/fonts.ts`](app/fonts.ts).
- Base layout: nocturnal theme, global container, themed header/footer, skip link, and a
  visible keyboard focus style driven by `--focus`. Reduced-motion variants throughout.
- [`.env.local.example`](.env.local.example) with **placeholders only**.

**Phase 1 — content site (ships first)**

- Routes: `/` (castle nav), `/great-hall` (home), `/sorting-hat`, `/projects`, `/about`,
  `/resume`, `/contact`, plus a themed 404. (The per-project `/projects/[slug]` pages were
  removed — cards link straight to the live sites.)
- **Contentlayer** ([`contentlayer2`](https://github.com/timlrx/contentlayer2)) MDX for the
  **six** projects in [`content/projects`](content/projects): Aura, CrowdFlow, Solar Connect,
  Balai ni Juan, Arduino Day PH 2025, and Sparkfest. Frontmatter carries `title`, `category`,
  `cover`, `link`, `stack`, `status`, and `order`; each card links straight to its live site.
- The **"owl post"** contact form posts to [`/api/contact`](app/api/contact/route.ts) with
  server-side Zod validation, an MX domain check, a honeypot, Cloudflare Turnstile, and a
  per-IP rate limit; Resend delivers the message once a key is added. See
  [Security & best practices](#security--best-practices).
- UI components matching the style guide: **spellbook cards**, buttons (gold "wax-seal"
  primary, ghost/outline secondary), inputs, badges/chips, and a dialog — see
  [`components/ui`](components/ui).
- **House theming works**: set `data-house="gryffindor|slytherin|ravenclaw|hufflepuff"` on
  any subtree to swap the accent (each project card already themes itself by house).

**Phase 2 — 3D castle navigation hub**

- An original **low-poly castle built procedurally** in React Three Fiber (no external glTF,
  no IP risk) — five glowing towers as nav, starfield sky, bloom postprocessing, and a
  subtle pointer-parallax camera. See [`components/castle`](components/castle).
- **Tower interaction**: hover lifts the glow; click glides the camera and routes. DOM label
  chips (drei `<Html>`) are keyboard-focusable.
- **Token-driven**: the scene reads the design tokens at runtime
  ([`lib/tokens.ts`](lib/tokens.ts)) so gold/glow/night-sky colors match the DOM and follow
  `data-house`.
- **Scroll-driven tour + window transitions**: the home castle runs a looping camera tour
  (wheel on desktop, touch on mobile — the page itself doesn't scroll); choosing a tower
  **flies into a lit window** and dissolves through a soft iris/portal reveal, and a
  **"back to castle"** header control returns you to the hub.
- **Lazy + accessible**: the three.js bundle is code-split and loaded only on eligible
  devices (WebGL + motion allowed), after first paint — **not** in the home page's First
  Load JS. The header tower nav is the always-present keyboard/accessible path; a 2D castle
  silhouette + error boundary cover no-WebGL / reduced-motion. (The old manual 2D/3D toggle
  was removed; mobile now runs the 3D tour.)

**Great Hall, Daily Prophet & projects (latest content pass)**

- The **Great Hall** (`/great-hall`) gained a bio intro, a **Tech Stack** section, an
  **Experience** section (work + leadership), and a **3D "Daily Prophet"** featured section:
  two scroll-driven newspapers (Aura + CrowdFlow) that fan open on scroll and re-fold on
  scroll-up, with a static both-papers-readable fallback for reduced-motion / no-WebGL.
- **Projects** is a 2-column grid of spellbook cards — cover image background with a soft
  bottom fade, full stack + description — each linking out to its **live site** (new tab).
- The **Sorting Hat** moved inline onto `/sorting-hat`; the floating "Ask the Hat" button was
  removed from every page.
- The **footer** stacks nav + contacts vertically with a **Resume** column, and the **"Behind
  the Magic"** section (on About) was slimmed to concise professional copy.

### Scaffolded stubs (clean typed interfaces + TODOs)

| Area                  | Status                                                  | Notes                                                                                 |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Ask the Hat (RAG)     | ✅ **Live** — [`lib/rag`](lib/rag), [`/api/ask`](app/api/ask/route.ts) | Gemini Flash-Lite + local embedded index; streaming, in-character, cited. See [Sorting Hat (RAG)](#sorting-hat-rag). |
| Get Sorted (Phase 3)  | Stub — [`/api/sort`](app/api) (not built)               | House classifier → `data-house` swap. Separate later task.                            |
| Music (Phase 4)       | Stub — [`MusicToggle`](components/atmosphere/music-toggle.tsx) | Default **OFF**, persisted, reduced-motion aware. No audio yet.                       |
| Wand cursor (Phase 4) | Stub — [`WandCursor`](components/atmosphere/wand-cursor.tsx)   | Desktop-only, reduced-motion aware, off switch. Lightweight follower preview.         |

---

## Folder structure

```
app/
  api/
    ask/route.ts          # Sorting Hat endpoint (stub)
    contact/route.ts      # Owl post endpoint (Resend stub + honeypot)
  great-hall/ sorting-hat/ projects/ about/ resume/ contact/   # routes
  fonts.ts                # next/font setup
  globals.css             # design tokens + house themes + base styles
  layout.tsx  page.tsx  not-found.tsx
components/
  ui/                     # button, input, textarea, label, badge, card, dialog, border-beam
  atmosphere/             # atmosphere wrapper + music-toggle + wand-cursor (Phase 4 stubs)
  castle/                 # castle-hub + castle-scene (R3F) + castle-fallback (2D)
  featured-prophet.tsx newspaper.tsx prophet-scene.tsx   # 3D "Daily Prophet" featured section
  tech-stack.tsx experience.tsx                          # Great Hall sections
  portal-transition.tsx page-reveal.tsx back-to-castle.tsx  # castle -> page window transitions
  sorting-hat/            # inline Sorting Hat chat (Phase 3 stub)
  site-header.tsx site-footer.tsx conditional-footer.tsx spellbook-card.tsx page-header.tsx mdx-content.tsx
content/projects/         # six MDX projects (link out to live sites)
lib/
  rag/                    # ingest / retrieve / ask (Phase 3 stubs) + types
  site.ts houses.ts projects.ts types.ts utils.ts use-preference.ts tokens.ts
public/projects/          # six cover images
docs/                     # PROJECT_DOCUMENTATION.md + Wizarding Design System.html (source of truth)
contentlayer.config.ts  tailwind.config.ts  components.json
```

---

## Design system

`docs/Wizarding Design System.html` is the single source of truth. Tokens were ported
verbatim. The 2D/3D boundary: **CSS/DOM owns all UI**; React Three Fiber owns the castle
scene and consumes shared tokens — gold `--accent` / `--accent-glow`, the per-house glow
triplets, `--bg` / `--bg-sunken` — read at runtime via [`lib/tokens.ts`](lib/tokens.ts).

To re-theme a subtree by house:

```tsx
<div data-house="ravenclaw">…accent + glow follow Ravenclaw here…</div>
```

---

## Environment variables

Copy `.env.local.example` → `.env.local`. **All keys are server-side only; never commit
real secrets.** Nothing here is needed for Phase 1.

| Variable                                                      | Used by                       | Needed when                            |
| ------------------------------------------------------------- | ----------------------------- | -------------------------------------- |
| `GEMINI_API_KEY`                                              | Answers **and** embeddings    | Sorting Hat (ingest + `/api/ask`)      |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN`                           | Cache + rate limiting         | Optional — `/api/ask` protection       |
| `RESEND_API_KEY` (+ `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL`) | Owl post email                | Phase 1 finalize (optional)            |
| `NEXT_PUBLIC_SITE_URL`                                        | Canonical/OG base URL         | Before deploy (no domain is hardcoded) |

> Retrieval uses a **committed local index** (`lib/rag/index.json`), so **no vector DB** is
> needed — Upstash **Redis** is the only optional cloud dependency, and only for caching +
> rate-limiting `/api/ask`. See [Sorting Hat (RAG)](#sorting-hat-rag).

> 💰 **Cost guardrail:** before exposing `/api/ask` publicly, set a **hard spend cap** on
> the Gemini key in Google AI Studio / Google Cloud billing. The public endpoint must also
> be rate-limited + cached (Upstash Redis) — wired in Phase 3.

---

## Sorting Hat (RAG)

The **"Ask the Sorting Hat"** chat ([`/sorting-hat`](app/sorting-hat)) answers questions
about Phoebe using **retrieval-augmented generation**, grounded strictly in her own content
and voiced in character (it politely declines anything off-topic).

**How it works**

1. **Corpus** — the seven project MDX files in [`content/projects`](content/projects), plus
   [`content/data.md`](content/data.md) (profile: summary, tech stack, experience, projects) and
   [`content/facts.md`](content/facts.md) (personal/fun facts).
2. **Ingest (build step)** — [`scripts/ingest.mjs`](scripts/ingest.mjs) chunks the corpus,
   embeds each chunk with Gemini `gemini-embedding-001`, and writes a committed local index to
   [`lib/rag/index.json`](lib/rag/index.json). No external vector DB.
3. **Ask** — [`/api/ask`](app/api/ask/route.ts) rate-limits (Upstash Redis, optional) →
   returns a cached answer if present → embeds the question and cosine-ranks the top 3–4
   chunks ([`lib/rag/retrieve.ts`](lib/rag/retrieve.ts)) → **streams** a short, in-character
   Gemini Flash-Lite answer grounded only in those chunks, with source citations.

**Setup**

```bash
cp .env.local.example .env.local     # then fill GEMINI_API_KEY (Upstash Redis optional locally)
npm run ingest                       # build lib/rag/index.json (re-run after ANY content edit)
npm run dev                          # restart if already running, to pick up the new index
```

Without a key — or before the first `npm run ingest` — the Hat replies in character
("my memory hasn't been woven yet…") instead of erroring.

**Editing what the Hat knows** — after **any** of these, re-run `npm run ingest` and restart:

- **Profile (summary, tech stack, experience, projects):** [`content/data.md`](content/data.md).
- **Fun / personal facts** (hobbies, favorites, quirks): [`content/facts.md`](content/facts.md)
  — replace the `(placeholder …)` lines; anything there is "about Phoebe" and in scope.
- **Projects:** the MDX frontmatter in [`content/projects`](content/projects).

> 💰 **Free-tier safe:** only the top 3–4 chunks and a low output-token cap per answer, plus
> Redis caching and a ~6-message/visitor/day limit. Keep the Gemini key on the free tier and
> set a hard spend cap before exposing `/api/ask` publicly. `GET_SORTED` (`/api/sort`) is a
> separate, later task.

---

## Security & best practices

Both public endpoints — the Sorting Hat (`/api/ask`) and the contact form (`/api/contact`)
— are built to be **safe to expose on free tiers**: abuse can't run up a bill, bots can't
flood them, and no secret ever reaches the browser. There's no database and no login, so the
realistic threats are spam and quota-burn — and each is handled.

### The Sorting Hat AI (`/api/ask`)

- **Keys stay server-side.** The Gemini key lives only in the serverless route; the browser
  never sees it.
- **Free-tier by design.** Runs on Gemini's free tier (no billing = a hard $0 ceiling). Set a
  hard spend cap on the key before going public as a backstop.
- **Per-visitor rate limit.** ~6 messages/visitor/day (Upstash Redis + `@upstash/ratelimit`,
  sliding window), keyed by client IP **plus** a random id kept in an **httpOnly** cookie
  (`hat_id`). Stops a script from draining the free quota; over the limit it returns `429`
  with an in-character "the Hat must rest" reply — never a raw error.
- **Answer caching.** Repeat questions are served from Redis instead of re-calling Gemini —
  cheaper, and ~3.2s → ~0.1s. Order in the route: **rate-limit → cache → model**.
- **Grounded + guarded.** Answers come only from the retrieved résumé / projects / facts,
  voiced in character; anything off-topic is politely declined — so the endpoint can't be used
  as a free general-purpose chatbot (which would burn quota and go off-brand).
- **Bounded cost per call.** Only the top 3–4 chunks are sent and output tokens are capped, so
  each answer stays small and well under Gemini's per-minute limits.
- **Graceful failure.** No key, no index, or a Gemini rate-burst → an in-character notice, not
  a stack trace.

### The contact form (`/api/contact`)

- **Server-side validation (Zod).** Name / email / message are validated on the server, so
  browser tampering can't bypass it; message length is bounded (10–1000 chars) to cap payload.
- **MX domain check.** A DNS `resolveMx` lookup confirms the email's domain can actually
  receive mail (catches typos like `gmail.con`) — Node built-in, no third-party API. It only
  rejects when a domain *definitively* can't receive mail; transient DNS errors fail **open**,
  so a flaky lookup never blocks a real visitor.
- **Honeypot.** A hidden field (`wand_signature`) real users never see; if a bot fills it, the
  request is silently accepted and dropped.
- **Cloudflare Turnstile.** An invisible CAPTCHA; the token is verified server-side before any
  email is sent, blocking the sophisticated bots the honeypot misses — with no puzzle for
  humans.
- **Per-IP rate limit.** ~4 submissions/IP/hour (Upstash Redis), so a script can't flood the
  inbox or exhaust the email quota.
- **Injection-safe.** User input is HTML-escaped before it enters the email body, and Resend's
  structured API (not raw SMTP) means form text can't forge email headers.
- **Reliable delivery.** Resend handles sender reputation + SPF/DKIM; the visitor's address is
  set as **reply-to**, so you just hit Reply.

### Shared practices

- **Secrets only in env vars, server-side, never committed** — real values in `.env.local`,
  placeholders in [`.env.local.example`](.env.local.example).
- **Free-tier + serverless** — Upstash Redis is reached over HTTPS, so there's no server to run
  or patch, and every dependency has a hard free ceiling.
- **Fail friendly** — visitors get an in-character message, never a raw error or stack trace.
- **Rate-limiting degrades gracefully** — without Redis configured (e.g. locally) the limiter
  is a no-op, so development is never blocked.

---

## Next steps (Phases 3–4)

**Phase 2 polish (optional).** The castle is procedural geometry. If you later want a
richer model, drop an original Draco-compressed glTF into the scene (swap the meshes in
[`castle-scene.tsx`](components/castle/castle-scene.tsx)) — the camera, hotspots, tokens,
and fallback all stay as-is.

**Phase 3 — the Hat (AI).** Add `GEMINI_API_KEY` + Upstash. Implement
[`lib/rag`](lib/rag): ingest content → Upstash Vector; `/api/ask` retrieval + grounded
Gemini answer with **streaming** (Vercel AI SDK) and citations; add Redis **rate-limit +
cache**. Then build "Get Sorted" (classification → `data-house` swap) and "Behind the
Magic".

**Phase 4 — atmosphere.** Wire **Howler.js** into `MusicToggle` (royalty-free/CC track,
**not** the film score; start on user gesture; fade in/out). Upgrade `WandCursor` to the
capped ember/sparkle trail + "cast" flourish. Both keep their toggles + accessibility.

**Phase 5 — polish.** Accessibility pass, Lighthouse budget, OG images + per-page
metadata, analytics.

---

## Accessibility & constraints

- WCAG 2.1 AA target: full keyboard nav, visible focus (`--focus`), reduced-motion
  variants, accessible text-nav fallback for the 3D castle, **music default-off**, wand
  cursor off switch (disabled on touch).
- Heavy things lazy-load (3D, audio in later phases); the content core stays fast.
- IP-safe: original wizarding-inspired assets only — no trademarked crests/logos or the
  copyrighted film score.

---

## Tech & versions

Next.js 14 · React 18 · TypeScript 5 · Tailwind CSS 3 · shadcn/ui-style components
(Radix + cva) · Framer Motion · React Three Fiber 8 + drei + postprocessing (three 0.169) ·
Contentlayer2 (MDX) · Zod · Lucide.

> **Stack notes:** Tailwind **v3** (the brief's `tailwind.config.ts` token mapping is v3's
> model) and **`contentlayer2`** (the maintained fork; the original `contentlayer` is
> unmaintained and breaks on modern Next.js). **React Three Fiber v8** (not v9, which
> requires React 19) for React 18 compatibility. All deliberate stability picks within the
> specified stack. `next dev` uses webpack (not Turbopack) so Contentlayer regenerates on
> change.
