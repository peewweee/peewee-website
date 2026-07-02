# Wizarding Portfolio — Project Documentation

> A Harry Potter–themed personal portfolio where an AI "Sorting Hat" answers questions about my work, set inside an interactive 3D castle that serves as the navigation.

|                   |                                                                                                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**         | Phoebe Rhone Gangoso — graduating BS Computer Engineering, PUP Manila                                                                                                                                            |
| **Career target** | AI Engineering roles                                                                                                                                                                                             |
| **Domain**        | To be decided — skipped for now                                                                                                                                                                                  |
| **Status**        | Build in progress — Phases 0–2 done (content site + 3D castle); Phase 3 (AI Hat) + Phase 4 (atmosphere) scaffolded as stubs                                                                                                                                                                          |
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
| **Great Hall** | Home / welcome | `/great-hall` |
| **Ask the Sorting Hat** | The AI Hat | `/sorting-hat` |
| **Library** | Projects (×4 case studies) | `/projects` |
| **Owlery** | Contact ("owl post") | `/contact` |
| **Potions** | About | `/about` |

`/resume` is a downloadable "acceptance letter" page, reached from the header/About rather than as a primary tower. Global on every page: the **music toggle** and the **wand cursor** (desktop).

---

## 4. Core features

### 4.1 Interactive 3D castle (navigation hub)

The landing page (`/`) is a full-screen, low-poly night-time castle — and it **is** the navigation. **Scroll drives a looping camera tour** around the castle (wheel on desktop, touch on mobile); the page itself never scrolls. Each glowing tower is a section, and choosing one **flies the camera into a lit window** and dissolves through a soft iris/portal reveal into that page. A **"back to castle"** control in the header returns you to the hub, re-seeded on the tower you came from.

- The heavy three.js bundle is **code-split and lazy-loaded** on eligible devices (WebGL + motion allowed), after first paint — it isn't in the home page's initial JS.
- The **header nav is the always-present accessible / keyboard path**; the castle is an enhancement, never the only way to navigate. A 2D castle **silhouette + tower list** covers no-WebGL and reduced-motion. _(The earlier manual 2D/3D toggle was removed, and mobile now gets the 3D tour too.)_
- The five towers: **Great Hall** (home), **Ask the Sorting Hat**, **Library** (projects), **Owlery** (contact), **Potions** (about).

### 4.2 The Sorting Hat (AI) — three modes

One character, three demos, telling a complete AI-engineering story:

1. **Ask the Hat (RAG).** Visitors ask about me; the Hat answers **only** from my resume + project write-ups, with source citations (e.g., "from: Aura"). Demonstrates retrieval-augmented generation, grounding, and prompt engineering. _This is the flagship._
2. **Get Sorted (classification).** The Hat asks a few quick questions (or reads a sentence the visitor types) and sorts them into a Hogwarts house; the site accent then shifts to that house. Demonstrates LLM classification and structured output. Light, fun, shareable.
3. **Behind the Magic (transparency).** A short, visual "how it works" panel showing the real pipeline (embeddings → vector search → LLM, plus caching and rate-limiting). This is what turns "cute chatbot" into "this person can ship AI."

**One panel, two modes.** The Hat has its own tower and route (**`/sorting-hat`**, "Ask the Sorting Hat") and is a single panel with two modes. It opens with two quick-reply chips — _"Ask about Phoebe"_ and _"Sort me into a house"_ — and the visitor can switch anytime; _Behind the Magic_ is a small expandable link in the same panel. The two chat modes route to two different backends (see §6): **Ask → `/api/ask`** (RAG) and **Sort → `/api/sort`** (classification). Intents are explicit chips rather than auto-detected — clearer for the visitor, and each request routes cleanly to the right endpoint.

**Guardrails.** Answers are strictly grounded in my data; the Hat politely refuses off-topic questions; the API key stays server-side; a spend cap + caching + rate-limiting protect the public endpoint.

### 4.3 Background music (wizarding ambience)

A looping orchestral "wizarding" ambience with a visible, themed toggle.

- **Default OFF.** Audio starts only on a user gesture (browser autoplay policies block sound otherwise). Modest volume. The preference is remembered between visits.
- A **visible, animated control** (e.g., a glowing musical rune) to mute/unmute; keyboard-accessible; the control's animation respects "reduced motion."
- **Licensing (important):** use a royalty-free / Creative Commons track that _evokes_ the vibe — **not** the copyrighted Harry Potter film score. _(Practical guidance, not legal advice.)_
- **Tech:** Howler.js for reliable cross-browser playback and fade in/out.

### 4.4 Wand cursor

The pointer becomes a wand with a subtle sparkle / ember trail; hovering an interactive element triggers a small "cast" flourish.

- **Desktop only** — disabled on touch devices (which have no pointer).
- **Never interferes with clicking** — the visual layer is `pointer-events: none`.
- **Respects "reduced motion"** (no trail / minimal) and offers an **off switch** to revert to the normal cursor for accessibility.
- Kept **lightweight** — capped particle count, driven by `requestAnimationFrame`.

### 4.5 The four projects (themed case studies)

Light theming on the card; the page itself is a **real case study** — problem, my role, stack, outcome, links/demo. Theme decorates, it never hides the substance.

| Project                                | Themed framing                                            | What it is                                                                                                                                                              |
| -------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Aura**                               | _Divination / crystal ball_ — "see your financial future" | AI financial-intelligence web app. Java 21, Spring Boot, PostgreSQL, Redis, Gemini API. Turns unstructured spending input into structured data + personalized insights. |
| **Solar-Connect**                      | _Lumos_ — light / solar                                   | Full-stack web app for a solar-powered charging-station thesis, integrated with the embedded firmware.                                                                  |
| **Arduino Day PH 2025 Website**        | _Room of Requirement_ — design gallery                    | UI/UX lead: led design volunteers, collaborated with web dev to design the official event site.                                                                         |
| **[Second UI/UX project — title TBD]** | _Room of Requirement_ — design gallery                    | Add final title, role, and links.                                                                                                                                       |

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

- **Vercel AI SDK** — one provider-agnostic interface with token streaming.
- **Google Gemini Flash-Lite** — generates answers **and** provides embeddings for retrieval, from a single key.
- **Upstash Vector** — serverless vector database; the index is built once from my resume + project notes.
- **Upstash Redis + @upstash/ratelimit** — caching and per-visitor rate limits to protect the public endpoint.

**Atmosphere**

- **Howler.js** — background music control.
- **Custom wand-cursor component** — lightweight DOM/canvas + CSS, with reduced-motion and off-switch support.

**Content & contact**

- **MDX + Contentlayer** — the four project case studies as version-controlled content.
- **Resend** — the "owl post" contact form email (+ a honeypot for spam).

**Hosting**

- **Vercel** (custom domain to be decided later), with optional **Vercel Analytics**.

Everything runs on free tiers. The only possible spend is Gemini once the project leaves the free tier — on Flash-Lite that is roughly ₱15–₱60/month for normal portfolio traffic (pay-as-you-go, with a hard spend cap available).

---

## 6. Architecture — how the Hat answers & sorts

**Build-time (once):** resume + project notes → chunked & embedded → stored in **Upstash Vector**.

**Request-time (per question):**

1. Visitor asks the Hat (Next.js + React Three Fiber UI).
2. Request hits **`/api/ask`** — a Vercel serverless route where the API key stays hidden.
3. **Upstash Redis** applies a per-visitor rate limit and serves a cached answer if one exists.
4. The query is embedded and matched against **Upstash Vector** to retrieve the most relevant resume/project chunks.
5. **Gemini Flash-Lite** (via the Vercel AI SDK) composes an answer grounded **only** in the retrieved text.
6. The answer streams back to the Hat with **source citations**.

**Get Sorted — a separate, simpler path (no retrieval).** House sorting does **not** touch the vector DB. The visitor's quick answers (or a sentence they type) go to **`/api/sort`** — a Vercel serverless route behind the same Upstash rate-limit — where **Gemini Flash-Lite** returns a **structured** result: one of the four houses + a one-line reason. The client then sets `data-house` on a subtree (instant accent/glow swap, no rebuild), persists the choice in `localStorage` so it sticks on return visits, and the 3D castle reads the same per-house glow triplet so the towers recolor too.

_Optional simpler version:_ Get Sorted could instead be a fixed **client-side quiz** (scored multiple-choice → house) with no server, no LLM, and no cost — but then it stops being an AI demo. The plan keeps the LLM version on purpose, as the second AI skill on display.

---

## 7. Build plan (phased — each phase ships something usable)

0. **Scaffold** — Next.js + TS + Tailwind, theme tokens (house colors), base layout, deploy a "hello world" to Vercel on the domain.
1. **Content site** — the four project pages, About, resume download, working contact form. _This alone is already a real portfolio._
2. **3D nav hub** — source + optimize the castle model, build the r3f scene, glowing clickable towers → routes, camera transitions, 2D/mobile fallback + accessible menu.
3. **The Hat** — ingest content → Upstash Vector; `/api/ask` with retrieval + Gemini + streaming; rate-limit & cache; the Great Hall chat UI with citations; "Behind the Magic"; and "Get Sorted" via a separate `/api/sort` classifier.
4. **Atmosphere** — background music (Howler) + wand cursor, both with visible toggles and accessibility support.
5. **Polish** — accessibility pass, performance budget (Lighthouse), reduced-motion variants, SEO / OG images, analytics.

Content first means there is always a shippable portfolio; the 3D, AI, and atmosphere layer on top without blocking it.

---

## 8. Design direction (starting points for the design system)

**Mood.** Elegant, magical, nocturnal — _an enchanted castle at night._ Refined and premium, **not** cartoonish or theme-park.

**Palette.**

- Base: deep night-sky **navy / indigo**, near-black charcoal.
- Surfaces / text on dark: **parchment / cream**.
- Accent: **gold / brass** for magical highlights and glows.
- **House themes** (used by "Get Sorted," and as the only place the four houses appear strongly): Gryffindor (scarlet + gold), Slytherin (emerald + silver), Ravenclaw (blue + bronze), Hufflepuff (yellow + black). Neutral **gold-on-navy** is the default until a visitor is sorted.

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

### 11.2 House theming (for "Get Sorted")

Houses are applied by setting `data-house="…"` on a subtree — the nocturnal base never changes, so there's no rebuild or flash; only `--accent`, `--accent-2`, `--accent-text`, and the glow swap. A matching JS map powers the Get Sorted logic.

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

The **design system owns everything in HTML/CSS** — components, the 2D fallback hero, the DOM tower-label chips, the wand cursor, the music toggle. **React Three Fiber / Three.js owns the castle scene itself** — model, lighting, camera moves, in-scene bloom and particles. The two stay cohesive because the 3D scene **consumes shared tokens** from the design system: the gold `--accent` + `--accent-glow` triplet for tower highlights, the per-house glow triplets for Get Sorted, the night-sky base colors (`--bg`, `--bg-sunken`), and the motion easings/durations for camera glides.

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
   focus). Include four switchable "house" accent themes used by the Get Sorted feature
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
   an accessible fallback text menu, badges/tags, dialog/modal, the background-music
   toggle, the wand cursor (idle, moving-with-sparkle-trail, hover/"cast", and a
   disabled/normal-cursor fallback), the "Behind the Magic" architecture panel, and
   loading/empty/error states.

7. Accessibility rules — WCAG 2.1 AA: contrast, visible focus states, full keyboard
   navigation, reduced-motion behavior, screen-reader structure, an accessible
   alternative to the 3D castle, music default-off, and a wand-cursor off switch
   (disabled on touch).

8. Responsive guidance — desktop delivers the 3D "wow"; mobile degrades to a clean
   themed 2D layout (static castle hero, normal nav, no custom cursor). Define
   breakpoints and how key components adapt.

OUTPUT FORMAT
(a) the design tokens as CSS variables AND a Tailwind theme config snippet;
(b) concise component specs as above; and
(c) a single self-contained HTML style-guide page that showcases the palette,
typography, and the core components in their states, so I can see the system applied.

Keep all assets original and wizarding-inspired — no trademarked crests, official logos,
or the film score.
```
