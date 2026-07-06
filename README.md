# Wizarding Portfolio — Phoebe Rhone Gangoso

A Harry Potter–themed portfolio for an **AI Engineering** career target. The signature
feature is an AI **"Sorting Hat"** that answers questions about Phoebe's work via
retrieval-augmented generation (RAG) over her resume + project write-ups, set inside an
interactive 3D castle that serves as the navigation.

> **Guiding principle:** the theme is a wrapper; the substance is real. Projects, resume,
> and contact stay fast, scannable, and accessible — a recruiter has ~30 seconds.

**Phases 0–2 plus a content pass are live:** the shippable content site, the interactive 3D
castle navigation hub (React Three Fiber), a fleshed-out **Great Hall** (bio, Tech Stack,
Experience, and a 3D "Daily Prophet" featured section), and **six real projects** that link
out to their live sites. The AI Hat now lives inline on its own page; its backend (Phase 3)
and the atmosphere effects (Phase 4) remain clean, typed **stubs**.

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
- The **"owl post"** contact form with client-side validation + a honeypot, posting to
  [`/api/contact`](app/api/contact/route.ts) (Resend stubbed until a key is added).
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

| Area                  | Stub                                                    | Notes                                                                                 |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Sorting Hat (Phase 3) | [`SortingHat`](components/sorting-hat/sorting-hat.tsx)  | Inline chat on `/sorting-hat` (floating button removed) with a "thinking" state + citation chips; calls the stubbed `/api/ask`. |
| RAG (Phase 3)         | [`lib/rag`](lib/rag)                                    | Typed `ingest` / `retrieve` / `ask` stubs.                                            |
| Ask API (Phase 3)     | [`/api/ask`](app/api/ask/route.ts)                      | Validates input, returns a stubbed grounded answer + citations.                       |
| Music (Phase 4)       | [`MusicToggle`](components/atmosphere/music-toggle.tsx) | Default **OFF**, persisted, reduced-motion aware. No audio yet.                       |
| Wand cursor (Phase 4) | [`WandCursor`](components/atmosphere/wand-cursor.tsx)   | Desktop-only, reduced-motion aware, off switch. Lightweight follower preview.         |

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

| Variable                                                      | Used by                    | Needed when                            |
| ------------------------------------------------------------- | -------------------------- | -------------------------------------- |
| `GEMINI_API_KEY`                                              | Answers **and** embeddings | Phase 3 (Sorting Hat)                  |
| `UPSTASH_VECTOR_REST_URL` / `_TOKEN`                          | Vector DB (retrieval)      | Phase 3                                |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN`                           | Cache + rate limiting      | Phase 3                                |
| `RESEND_API_KEY` (+ `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL`) | Owl post email             | Phase 1 finalize (optional)            |
| `NEXT_PUBLIC_SITE_URL`                                        | Canonical/OG base URL      | Before deploy (no domain is hardcoded) |

> 💰 **Cost guardrail:** before exposing `/api/ask` publicly, set a **hard spend cap** on
> the Gemini key in Google AI Studio / Google Cloud billing. The public endpoint must also
> be rate-limited + cached (Upstash Redis) — wired in Phase 3.

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
