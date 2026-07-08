# Wizarding Portfolio — Project Documentation

> A Harry Potter–themed personal portfolio where an AI "Sorting Hat" answers questions about my work, set inside an interactive 3D castle that serves as the navigation.

|                   |                                                                                                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**         | Phoebe Rhone Gangoso — graduating BS Computer Engineering, PUP Manila                                                                                                                                            |
| **Career target** | AI Engineering roles                                                                                                                                                                                             |
| **Domain**        | To be decided — skipped for now                                                                                                                                                                                  |
| **Status**        | Live & deployed on Vercel — content site + 3D castle exceeding the original plan; the Great Hall (bio, Tech Stack, Experience) and the 3D "Daily Prophet" featured section are built; **seven** projects on the Projects page (six live, FairySplit WIP). **Phase 3 is essentially done:** the Ask-the-Hat RAG chat and the hardened contact form are **live** (a chatbot only); Phase 4 (atmosphere) is done — wand cursor + music toggle are live. What remains is Phase-5 polish (SEO/OG, sitemap, robots, analytics) — see §12.                                                                                                                                                                          |
| **This document** | The brief for the design phase and the build. Covers concept, audience, sitemap, features, tech stack, architecture, plan, and design direction. A ready-to-paste prompt for the design system is in Appendix A. |

> **Note on the name:** the owner name above is taken from the resume (Phoebe Rhone Gangoso). Swap it everywhere if the site should carry a different name. The site config also uses the nickname **"Peewee"** and the on-site role label **"Software & AI Developer."**

---

## 1. Goals & audience

**Goal.** A memorable, interactive portfolio that gets me hired into AI Engineering — and that _demonstrates_ AI skill rather than just listing it. I have strong AI experience (RAG, vector search, prompt engineering) but only a few standalone AI projects, so the website itself becomes the proof: the AI features are the portfolio piece.

**Audience.**

- **Recruiters / hiring managers** — skim in ~30 seconds, need to grasp "this person can ship production AI" and find my resume + contact fast.
- **Engineers** — want depth: how things are built, the tradeoffs, the architecture.
- **Peers / the curious** — enjoy the experience and share it.

**Success looks like:** a recruiter immediately understands my AI capability, reaches the resume/contact in one click, and remembers the site afterward.

---

## 2. Concept

A Hogwarts / wizarding theme. The **Sorting Hat is the site's AI character** — in the books it reads information and talks back, which makes it perfect, on-theme cover for an AI assistant. The **castle is the navigation**.

**Guiding principle — theme is the wrapper, the substance is real.** The Hogwarts skin lives on the chrome (Great Hall, owl post, spellbook cards). Real content — projects, resume, contact — is always one click away and fully readable. The magic must never block the 30-second recruiter scan.

The headline differentiator: _the castle makes me memorable; the Hat makes me hireable._ The magic is the hook; the AI features are the signal.

---

## 3. Sitemap

The landing page (`/`) **is the 3D castle** — a full-screen navigation hub. Each structure on the castle is a "tower" that warps to its section:

| Tower (on the castle) | Section | Route |
| --- | --- | --- |
| **Great Hall** | Home / welcome — bio, Tech Stack, Experience & the "Daily Prophet" featured projects | `/great-hall` |
| **Ask the Sorting Hat** | The AI Hat — inline chat | `/sorting-hat` |
| **Library** | Projects — six cards linking out to live sites | `/projects` |
| **Owlery** | Contact ("owl post") | `/contact` |
| **Potions** | About + "Behind the Magic" | `/about` |

`/resume` is an "acceptance letter" page linked from the header/footer rather than a primary tower. Global on every page: the **music toggle** and the **wand cursor** (desktop).

---

## 4. Core features

### 4.1 Interactive 3D castle (navigation hub)

The landing page (`/`) is a full-screen, low-poly night-time castle — and it **is** the navigation. **Scroll drives a looping camera tour** around the castle (wheel on desktop, touch on mobile); the page itself never scrolls. Each glowing tower is a section, and choosing one **flies the camera into a lit window** and dissolves through a soft iris/portal reveal into that page. A **"back to castle"** control in the header returns you to the hub, re-seeded on the tower you came from.

- The heavy three.js bundle is **code-split and lazy-loaded** on eligible devices (WebGL + motion allowed), after first paint — it isn't in the home page's initial JS.
- The **header nav is the always-present accessible / keyboard path**; the castle is an enhancement, never the only way to navigate. A 2D castle **silhouette + tower list** covers no-WebGL and reduced-motion. _(The earlier manual 2D/3D toggle was removed, and mobile now gets the 3D tour too.)_
- The five towers: **Great Hall** (home), **Ask the Sorting Hat**, **Library** (projects), **Owlery** (contact), **Potions** (about).

### 4.2 The Sorting Hat (AI) — the AI showcase

The Sorting Hat is an AI **chatbot** that answers questions about me — and it doubles as a portfolio piece:

1. **Ask the Hat (RAG).** Visitors ask about me; the Hat answers **only** from my resume + project write-ups, with source citations (e.g., "from: Aura"). Demonstrates retrieval-augmented generation, grounding, and prompt engineering. _This is the flagship._
2. **Behind the Magic (transparency).** A short "how it works" summary of the real pipeline (embeddings → vector search → LLM, plus caching and rate-limiting) — what turns "cute chatbot" into "this person can ship AI." _A static summary on the **About** page that accurately describes the real pipeline; a live/data-driven version is an optional future touch._

**Inline on its own page.** The Hat is a full inline chat on its own route (**`/sorting-hat`**, "Ask the Sorting Hat") — the old floating "Ask the Hat" button was removed from every page. Visitors ask anything about me and it answers from **`/api/ask`** (RAG), grounded in my data and politely declining anything off-topic. It's a chatbot — no modes, quizzes, or house-sorting.

**Guardrails.** Answers are strictly grounded in my data; the Hat politely refuses off-topic questions; the API key stays server-side; a spend cap + caching + rate-limiting protect the public endpoint.

> **Build status:** **live and deployed** — `/api/ask` retrieves over a committed local index and returns a grounded Gemini `gemini-2.5-flash` answer (non-streaming) with citations. See §12.

### 4.3 Background music (wizarding ambience)

A looping orchestral "wizarding" ambience with a visible, themed toggle.

- **Autoplay-safe.** Playback begins on the visitor's first click/keypress (browsers block autoplay), fades in to a modest volume, loops, and remembers the on/off choice between visits. (As built it defaults on — one click silences it.)
- A **visible, animated control** (e.g., a glowing musical rune) to mute/unmute; keyboard-accessible; the control's animation respects "reduced motion."
- **Licensing (important):** use a royalty-free / Creative Commons track that _evokes_ the vibe — **not** the copyrighted Harry Potter film score. _(Practical guidance, not legal advice.)_
- **Tech:** the native HTML5 `Audio` element — looping playback with a fade in/out (no external audio library).

> **Build status:** **live** — real looping playback of `public/audio/ambience.mp3` with fade in/out, autoplay-safe (starts on the visitor's first interaction), and the on/off choice is remembered. See §12.

### 4.4 Wand cursor

The pointer becomes a wand with a subtle sparkle / ember trail; hovering an interactive element triggers a small "cast" flourish.

- **Desktop only** — disabled on touch devices (which have no pointer).
- **Never interferes with clicking** — the visual layer is `pointer-events: none`.
- **Respects "reduced motion"** (no trail / minimal) and offers an **off switch** to revert to the normal cursor for accessibility.
- Kept **lightweight** — capped particle count, driven by `requestAnimationFrame`.

> **Build status:** **live** — the full wand SVG (eased follow) + capped 12-spark trail + "cast" flourish over interactive elements, with an off-switch (`WandToggle`), desktop-only and reduced-motion aware.

### 4.5 Projects — the "Library" (seven projects, linking to live work)

The Projects page ("The Library") is a **2-column grid of "spellbook" cards**. Each card uses the project's cover image as its background with a soft multi-stop bottom fade, shows the **full stack and description**, and **links straight to the live site in a new tab** — the old per-project `/projects/[slug]` case-study pages were removed. Content lives as MDX frontmatter in `content/projects/*.mdx`; the schema carries `category`, `cover`, `link`, `stack`, `status`, and `order`.

| Project | Category | Live link | Stack |
| --- | --- | --- | --- |
| **Aura — AI-Powered Financial Intelligence** | AI · FinTech | aura-finance.me | Java, Spring Boot, PostgreSQL, Redis, Gemini API |
| **CrowdFlow — Itinerary Planner** | AI | crowdflowph.vercel.app | Next.js, TypeScript, Tailwind, React, Leaflet, Gemini API, OpenWeather |
| **Solar Connect** | Web App · IoT | solarconnect.live | Next.js, TypeScript, Tailwind, Supabase, OpenWeather |
| **Balai ni Juan** | Web | balai-ni-juan.vercel.app | JavaScript, HTML, CSS |
| **Arduino Day PH 2025** | UI/UX | Figma prototype | Figma |
| **Sparkfest** | UI/UX | sparkfest-2025.vercel.app | Figma |
| **FairySplit** _(WIP)_ | Web App | — (in progress) | React, Vite, NestJS, PostgreSQL |

### 4.6 The Great Hall page & the 3D "Daily Prophet"

The **Great Hall** (`/great-hall`, the "Home" nav item) is the welcome/landing content: a short bio intro with **View projects** / **Ask the Sorting Hat** buttons, a **Tech Stack** section (grouped skills + icons), an **Experience** section (work history + leadership), and the featured-projects section below.

**Featured projects — a "Daily Prophet" front page in 3D.** Two scroll-driven 3D newspapers (**Aura** and **CrowdFlow**) under a blackletter masthead: they **fan open as the section scrolls into view and re-fold on scroll-up**, finishing as they reach center. Tunable knobs control size, lift, spread/overlap, and tilt. Reduced-motion / no-WebGL visitors get a static, both-papers-readable layout; screen-reader users get real links (the papers are decorative). A **"Read more →"** link leads to the full Projects page.

---

## 5. Tech stack

**Frontend**

- **Next.js (App Router) + TypeScript** — the site and the Hat's API live in one project; SSG/SSR for SEO.
- **Tailwind CSS + shadcn/ui** — themed styling + accessible component primitives.
- **Framer Motion** — page transitions and the Hat / parchment reveals.

**3D nav hub**

- **React Three Fiber + drei** — the castle scene and clickable towers.
- **@react-three/postprocessing (Bloom)** — the glow on towers and hotspots.
- **Original low-poly glTF castle** — Draco-compressed, lazy-loaded, with a 2D fallback.

**The Sorting Hat (AI)**

- **Vercel AI SDK** — one provider-agnostic interface for the Gemini calls (`generateText`).
- **Google Gemini 2.5 Flash** — generates answers; **`gemini-embedding-001`** provides embeddings for retrieval (one key).
- **Local embedded index** (`lib/rag/index.json`) — Gemini embeddings committed to the repo and ranked in-memory by cosine similarity; **no vector DB**. Rebuilt by `npm run ingest`.
- **Upstash Redis + @upstash/ratelimit** — caching and per-visitor rate limits to protect the public endpoint.

**Atmosphere**

- **Native HTML5 `Audio`** — looping background music with fade in/out (no external audio library).
- **Custom wand-cursor component** — lightweight DOM/canvas + CSS, with reduced-motion and off-switch support.

**Content & contact**

- **MDX + Contentlayer** — the four project case studies as version-controlled content.
- **Resend** — the "owl post" contact form email (+ a honeypot for spam).

**Hosting**

- **Vercel** (custom domain to be decided later), with optional **Vercel Analytics**.

Everything runs on free tiers. The only possible spend is Gemini once the project leaves the free tier — on `gemini-2.5-flash` that stays pocket change at portfolio traffic (pay-as-you-go, with a hard spend cap available).

---

## 6. Architecture — how the Hat answers

**Build-time (once):** résumé + project notes → chunked & embedded (`npm run ingest`) → committed to a **local index** (`lib/rag/index.json`). No vector DB.

**Request-time (per question):**

1. Visitor asks the Hat (Next.js + React Three Fiber UI).
2. Request hits **`/api/ask`** — a Vercel serverless route where the API key stays hidden.
3. **Upstash Redis** applies a per-visitor rate limit and serves a cached answer if one exists.
4. The query is embedded and matched by in-memory cosine similarity against the **local index** (`lib/rag/index.json`) to retrieve the most relevant chunks.
5. **Gemini 2.5 Flash** (via the Vercel AI SDK) composes an answer grounded **only** in the retrieved text.
6. The answer is returned to the Hat (non-streaming) with **source citations**.

---

## 7. Build plan (phased — each phase ships something usable)

0. **Scaffold** — Next.js + TS + Tailwind, theme tokens (house colors), base layout, deploy a "hello world" to Vercel on the domain.
1. **Content site** — the four project pages, About, resume download, working contact form. _This alone is already a real portfolio._
2. **3D nav hub** — source + optimize the castle model, build the r3f scene, glowing clickable towers → routes, camera transitions, 2D/mobile fallback + accessible menu.
3. **The Hat** — ✅ ingest content → local `index.json` (`npm run ingest`); `/api/ask` with retrieval + Gemini generation (non-streaming) + citations; rate-limit & cache. **Remaining:** the optional live "Behind the Magic" panel.
4. **Atmosphere** — ✅ background music (native `Audio` playing `ambience.mp3`, fade, gesture-safe) + the sparkle-trail wand cursor, both with visible toggles + accessibility.
5. **Polish** — accessibility pass, performance budget (Lighthouse), reduced-motion variants, SEO / OG images, analytics.

Content first means there is always a shippable portfolio; the 3D, AI, and atmosphere layer on top without blocking it.

---

## 8. Design direction (starting points for the design system)

**Mood.** Elegant, magical, nocturnal — _an enchanted castle at night._ Refined and premium, **not** cartoonish or theme-park.

**Palette.**

- Base: deep night-sky **navy / indigo**, near-black charcoal.
- Surfaces / text on dark: **parchment / cream**.
- Accent: **gold / brass** for magical highlights and glows.
- **House accent set** (four themes in the design system, currently unused): Gryffindor (scarlet + gold), Slytherin (emerald + silver), Ravenclaw (blue + bronze), Hufflepuff (yellow + black). Neutral **gold-on-navy** is the site default.

**Typography.** An engraved, elegant **serif for display/headings** (e.g., Cinzel or Cormorant Garamond) paired with a **highly readable sans for body** (e.g., Inter). Optional ink/handwritten accent, used sparingly. Legibility always beats flourish.

**Texture & style.** Mostly flat, with subtle parchment texture on select surfaces and **soft candlelit glows** for magical/interactive elements. Recurring motifs: stars/constellations, wax seals, parchment edges. Thin-line icons with a light flourish.

**Motion.** Floating easing, candle-flicker glows, parchment-unfurl reveals, the Hat "waking," camera glides between castle sections — every effect with a **reduced-motion variant**.

**Components the design system should define.** Color + house-theme tokens; type scale; spacing, radii, glow/shadow system; buttons (gold "wax-seal" primary, secondary, ghost); inputs + the "owl post" form; project "spellbook" cards; the Sorting Hat chat panel (incl. a "the Hat is thinking…" state and citation chips); 3D tower/nav hotspot labels; primary nav (castle) + accessible fallback menu; badges/tags; dialog/modal; the music toggle; wand-cursor states; the "Behind the Magic" architecture panel; and loading / empty / error states.

---

## 9. Constraints & non-negotiables

- **Fast, scannable core.** Projects, resume, and contact reachable in one click. The 30-second recruiter must succeed even with all the magic switched on.
- **Accessibility (WCAG 2.1 AA).** Verified color contrast (check gold-on-navy carefully), full keyboard navigation, visible focus states, reduced-motion variants, screen-reader-friendly structure, an accessible alternative to the 3D castle, music default-off, and a wand-cursor off switch (disabled on touch).
- **Performance.** Fast first paint; lazy-load the 3D and audio; compressed assets; aim for strong Lighthouse scores.
- **Responsive.** The 3D castle tour runs on **both desktop (wheel) and mobile (touch)** — there's no manual 2D/3D toggle. Ineligible cases (no-WebGL, reduced-motion) fall back to a 2D castle silhouette + the header tower nav, which is also the keyboard/accessible path.
- **IP & licensing (practical, not legal advice).** Use original, "wizarding-inspired" assets. Avoid official trademarked crests/logos, the copyrighted film score, and ripped 3D models. Keep it an original fan tribute.
- **AI safety & cost.** Key server-side; grounded answers only; refuse off-topic; spend cap + cache + rate-limit.

---

## 10. Out of scope (possible later upgrades)

A fully walkable castle interior; voice for the Hat; mini-games; multiple live embedded demos. All are Phase 2+ ideas, deliberately deferred to keep v1 focused and shippable.

---

## 11. Design system (built)

The visual design system has been generated and lives in this folder as **`Wizarding Design System.html`** — a self-contained, interactive style guide showing the tokens and every component in all its states. The build should treat it as the single source of truth for visual styling and port its tokens directly into the codebase.

**Files (now organized by the build)**

- `docs/PROJECT_DOCUMENTATION.md` — this document (the build brief).
- `docs/Wizarding Design System.html` — the interactive design system / style guide (single source of truth for visual styling).
- `docs/CLAUDE_CODE_PROMPT.md` — the original Claude Code kickoff prompt.
- `README.md` (repo root) — the build's own status, folder structure, and run instructions.
- The Next.js app itself: `app/`, `components/`, `lib/`, `content/`.

### 11.1 Color tokens (CSS variables)

Nocturnal navy base, parchment surfaces, gold accent. Defined in `:root`:

- **Background:** `--bg #0B1026`, `--bg-elev #10152E`, `--bg-sunken #070A18`
- **Surface:** `--surface #161B38`, `--surface-2 #1D2342`
- **Parchment:** `--parchment #F4ECD8`, `--parchment-2 #EAE0C6`
- **Text on dark:** `--text #F4ECD8`, `--text-muted #B9C0D8`, `--text-faint #8C93B0`
- **Ink (text on parchment):** `--ink #221C0E`, `--ink-muted #5C5238`, `--ink-faint #8A7E5E`
- **Borders:** `--border`, `--border-strong`, `--border-ink`
- **Gold / accent:** `--accent` / `--gold #D4AF37`, `--gold-hover #E2C158`, `--gold-press #B8952B`, `--accent-text #E8C766`, `--accent-ink #1A1206`
- **Status:** `--success #57BE89`, `--warning #E0A93B`, `--danger #E97A70`
- **Focus ring:** `--focus #B7A6FF`
- **Glow:** `--accent-glow 212,175,55` (raw RGB triplet, used inside `rgba()` for glows)

### 11.2 House accent themes (design system)

The design system defines four house accent themes, applied by setting `data-house="…"` on a subtree (swaps `--accent`, `--accent-2`, `--accent-text`, and the glow; the nocturnal base never changes). They're an available accent set only — the site stays on the neutral default (nothing switches them at runtime).

| House      | Accent    | Secondary          | Glow (RGB)   |
| ---------- | --------- | ------------------ | ------------ |
| Gryffindor | `#B11E36` | `#D4AF37` (gold)   | `177,30,54`  |
| Slytherin  | `#1F7A52` | `#BFC6CE` (silver) | `31,122,82`  |
| Ravenclaw  | `#2E5BBF` | `#B08D57` (bronze) | `46,91,191`  |
| Hufflepuff | `#E8B71E` | `#1A1A1A`          | `232,183,30` |

### 11.3 Typography

- **Cinzel** — display / headings (engraved, magical)
- **Cormorant Garamond** — editorial serif (hero lines, large quotes)
- **Inter** — UI / body (legibility)
- **JetBrains Mono** — code, token labels, the "Behind the Magic" panel

### 11.4 Motion

Easing tokens: `--ease-float`, `--ease-out-soft`, `--ease-candle`, `--ease-glide`. Duration tokens (e.g. `--dur-unfurl 900ms`) drive the parchment-unfurl and related reveals. Every effect must ship a reduced-motion variant.

### 11.5 The 2D ↔ 3D boundary

The **design system owns everything in HTML/CSS** — components, the 2D fallback hero, the DOM tower-label chips, the wand cursor, the music toggle. **React Three Fiber / Three.js owns the castle scene itself** — model, lighting, camera moves, in-scene bloom and particles. The two stay cohesive because the 3D scene **consumes shared tokens** from the design system: the gold `--accent` + `--accent-glow` triplet for tower highlights, the night-sky base colors (`--bg`, `--bg-sunken`), and the motion easings/durations for camera glides.

---

## 12. Current build status (vs. the plan)

_Phases 1–2 are done and exceed the plan. **Phase 3 is essentially done:** the Ask-the-Hat RAG chat and the hardened contact form are live (a chatbot only). Phase 4 (atmosphere) is done, and the site is **deployed and live on Vercel** with all env keys set. What remains is Phase-5 polish (SEO/OG, sitemap, robots, analytics) and an accessibility/Lighthouse pass._

**Changed from the plan**

- **Landing page flipped.** `/` **is** the 3D castle; the Great Hall moved to `/great-hall` (the "Home" nav points there). — `app/page.tsx`, `lib/site.ts`
- **Projects have no detail pages.** Seven real projects, no `/projects/[slug]` — 2-column "spellbook" cards that link out to live sites. — `app/projects/page.tsx`, `content/projects/`
- **Sorting Hat moved inline** onto its own `/sorting-hat` route; the floating chat button was removed. — `components/sorting-hat/`
- **Great Hall got much richer** than a themed hero — Tech Stack, Experience, and the 3D "Daily Prophet" featured newspapers. — `app/great-hall/page.tsx`
- **Contact is the "owl post" form** (Full Name / Email / Message) with real social icons wired.

**Added beyond the plan**

- The 3D "Daily Prophet" scroll-driven newspapers; castle **tower labels + a pulsing Sorting-Hat map indicator**; the Experience **timeline beam**; a **7th project (FairySplit)**; and real LinkedIn / GitHub / Email / Facebook links.

**Now delivered (since the plan was written)**

- **Ask-the-Hat RAG is live.** `/api/ask` embeds the question, cosine-ranks the top chunks of a committed **local index** (`lib/rag/index.json` — no vector DB), and returns a grounded, in-character Gemini `gemini-2.5-flash` answer (non-streaming) with citations; order is **rate-limit → cache → model**. — `app/api/ask/route.ts`, `lib/rag/`
- **Contact form is hardened + wired.** `/api/contact` runs server-side Zod, an MX check, a honeypot, Cloudflare Turnstile, a per-IP rate limit, HTML-escaping, and Resend delivery (sends once `RESEND_API_KEY` is set). — `app/api/contact/route.ts`
- **Atmosphere is live.** The **wand cursor** (wand SVG with an eased follow, a capped 12-spark trail, a "cast" flourish over interactive elements, an off-switch, desktop-only + reduced-motion aware) and the **music toggle** (looping HTML5 `Audio` with fade, autoplay-safe, persisted) are both built. — `components/atmosphere/`
- **Deployed to Vercel.** The site is live on Vercel with all env keys set (Gemini, Upstash Redis, Resend, Cloudflare Turnstile).

**Still to do**

- **Phase 5 polish.** Still to add: an OG/social image, `app/sitemap.ts`, `app/robots.ts`, and web analytics; an accessibility + Lighthouse pass is also pending.
- **"Behind the Magic" is a static summary (accurate).** The About-page panel correctly describes the live pipeline (embed → local index → retrieve → Gemini 2.5 Flash → cache/rate-limit). Making it a live/data-driven panel is an optional nice-to-have. — `app/about/page.tsx`
- **Optional cleanup.** Remove the inert Get-Sorted `house` param still in `app/api/ask/route.ts` + `lib/rag/ask.ts`; add `gray-matter` as a direct dev-dependency (it's currently transitive).

---

## 13. External services (and why each earns its place)

The services wired into the site (excluding Gemini), chosen so a public, recruiter-facing portfolio stays **reliable, spam-proof, and free to run**.

| Service | Category | What it does here |
| --- | --- | --- |
| **Resend** | Transactional email | Delivers "owl post" contact messages to the Gmail inbox |
| **Cloudflare Turnstile** | Invisible CAPTCHA | Confirms the sender is human before a message is sent |
| **Upstash Redis** | Serverless key-value store | Rate-limits the endpoints + caches the Hat's answers |
| _(DNS MX lookup)_ | Built-in, not a paid API | Checks an email's domain can actually receive mail |

**Resend — so the contact form actually works.** A form that doesn't deliver is just decoration. You can't reliably send email straight from a browser or a random SMTP server — it lands in spam or gets blocked. Resend is built for app-to-inbox delivery (handles sender reputation, SPF/DKIM), so a recruiter's message reliably reaches the inbox. _Importance:_ turns the "Send an Owl" form into a real way to get hired.

**Cloudflare Turnstile — so bots can't abuse it.** Any public form is a spam magnet — bots blast junk, phishing, and burn quotas. Turnstile is an _invisible_ bot check: it verifies real humans without making them solve puzzles. _Importance:_ keeps the inbox clean and protects the free email/AI quotas from automated abuse, with zero friction for real visitors.

**Upstash Redis — the cost + abuse guardrail (two jobs).**

- _Rate-limiting_ — caps requests per visitor (contact: 4/hour by IP; Hat: 6/day). Stops a script from flooding the endpoints and running up the free Gemini/email limits.
- _Answer caching_ — repeat questions to the Hat are served instantly from Redis instead of re-calling Gemini (measured ~3.2s → ~0.1s). Faster _and_ it saves the free AI quota.

_Importance:_ this is what makes it safe to expose an AI feature on a free tier publicly. It's serverless (HTTP/REST), so it runs on Vercel with no server to manage. The [`/api/ask`](app/api/ask/route.ts) route does **rate-limit → cache → model**, in that order.

**DNS MX lookup — data quality, no paid service.** The contact form does a DNS lookup to confirm an email's domain can receive mail (catches `gmail.con`). It's built into Node — no third-party API needed. _Importance:_ makes the reply-to address real, so you can actually reply — the free, correct alternative to a paid email-verification API.

**The through-line:** every pick is free-tier, serverless-friendly, and solves one real production problem — delivery (Resend), spam (Turnstile), cost/abuse (Upstash), data quality (MX). An AI feature that's rate-limited, cached, and abuse-protected is exactly the "can ship production AI" story the portfolio is trying to prove — and a solid thing to walk through in an interview.

---

## Appendix A — Design-system prompt for Claude design

Paste the block below into Claude design (attach this document for full context).

```text
You are designing the visual design system for my personal portfolio website. Brief below.

PROJECT
A Harry Potter–themed portfolio for Phoebe Rhone Gangoso, a graduating Computer
Engineering student pursuing AI Engineering roles. The signature feature is an AI
"Sorting Hat" that answers questions about my work (RAG) and sorts visitors into
Hogwarts houses, set inside an interactive 3D castle that serves as the navigation.
Built with Next.js + TypeScript, Tailwind CSS, and
shadcn/ui — so the design system must express as design tokens that map cleanly to a
Tailwind theme (CSS variables).

MOOD
Elegant, magical, nocturnal — "an enchanted castle at night." Refined and premium,
NOT cartoonish or theme-park. Guiding principle: the theme is a wrapper; real content
(projects, resume, contact) must stay fast, scannable, and accessible — a recruiter has
about 30 seconds.

AUDIENCE
Tech recruiters / hiring managers (skim fast) and engineers (want depth).

DESIGN A COMPLETE, COHESIVE DESIGN SYSTEM. DELIVER:

1. Color system — a nocturnal base (deep navy/indigo), parchment/cream surfaces, and a
   gold/brass accent for magical highlights and glows. Provide semantic tokens
   (background, surface, text, muted, border, primary, accent, success/warning/danger,
   focus). Include four "house" accent themes (an available accent set)
   — Gryffindor (scarlet/gold), Slytherin (emerald/silver), Ravenclaw (blue/bronze),
   Hufflepuff (yellow/black) — plus a neutral default. Give exact hex values and ensure
   all text/background pairings meet WCAG 2.1 AA (verify gold-on-navy).

2. Typography — an elegant, engraved-feel serif for display/headings and a highly
   readable sans for body. Define families, the type scale, weights, line-heights, and
   usage rules. Prioritize legibility over flourish.

3. Spacing, layout & shape — a spacing scale, container/grid, border-radii, and an
   elevation/glow system (soft candlelit glows for interactive/magical elements;
   restrained shadows elsewhere; mostly flat with optional subtle parchment texture).

4. Iconography & motifs — a thin-line icon style with a light magical flourish, and the
   recurring motifs (stars/constellations, wax seals, parchment) with rules for using
   them without clutter.

5. Motion principles — floating easing, candle-flicker glows, parchment-unfurl reveals,
   the Hat "waking," and camera glides between castle sections. Define durations and
   easings, and a reduced-motion variant for every effect.

6. Component specs — appearance, variants, and ALL states
   (default/hover/focus/active/disabled/loading/error) for: buttons (gold "wax-seal"
   primary, secondary, ghost), inputs and the "owl post" contact form, project
   "spellbook" cards, the Sorting Hat chat panel (including a "the Hat is thinking…"
   state and citation chips), 3D tower/nav hotspot labels, the primary navigation plus
   an accessible fallback