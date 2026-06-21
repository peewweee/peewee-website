# Claude Code — Project Kickoff Prompt

Open Claude Code in this folder (it already contains `PROJECT_DOCUMENTATION.md` and `Wizarding Design System.html`) and paste the prompt below.

---

```text
You are starting a new web project in THIS folder, which already contains two reference
files. Read them before writing any code.

READ FIRST
1. PROJECT_DOCUMENTATION.md — the full brief: concept, features, tech stack, architecture,
   the phased build plan, and the constraints. Follow it.
2. Wizarding Design System.html — the built design system / interactive style guide.
   Extract its design tokens (the :root CSS variables, the [data-house="…"] theme blocks,
   the font families, easings, and duration tokens) and its component styling. This file
   is the single source of truth for visual design — match it.

WHAT WE'RE BUILDING
A Harry Potter–themed portfolio for Phoebe Rhone Gangoso (career target: AI Engineering).
The signature feature is an AI "Sorting Hat": it answers questions about her work via RAG
over her resume + project write-ups, and it sorts visitors into Hogwarts houses. It lives
inside an interactive 3D castle that serves as the site navigation. Guiding principle: the
theme is a wrapper — real content (projects, resume, contact) must stay fast, scannable,
and accessible. A recruiter has ~30 seconds.

TECH STACK (use exactly this)
- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion
- 3D (later phase): React Three Fiber + drei + @react-three/postprocessing
- AI (later phase): Vercel AI SDK + Google Gemini Flash-Lite (answers AND embeddings);
  Upstash Vector (vector DB); Upstash Redis + @upstash/ratelimit (cache + limits)
- Content: MDX + Contentlayer
- Contact: Resend
- Deploy target: Vercel. The domain is undecided — do NOT hardcode any domain.

DO NOW — PHASE 0 (scaffold)
1. Initialize Next.js (App Router, TypeScript, ESLint) + Tailwind + shadcn/ui. Add Prettier.
2. Port the design tokens from "Wizarding Design System.html" into app/globals.css as CSS
   variables: the full :root set PLUS the [data-house="gryffindor|slytherin|ravenclaw|
   hufflepuff"] theme blocks. Mirror the semantic tokens in tailwind.config.ts (colors,
   fontFamily, etc.) so Tailwind utilities map to the tokens.
3. Load fonts with next/font: Cinzel (display), Cormorant Garamond (serif), Inter
   (body/UI), JetBrains Mono (mono).
4. Build the base layout: nocturnal dark theme, a global container, a themed header/footer
   using the tokens, and a visible keyboard focus style driven by --focus.
5. Add .env.local.example with PLACEHOLDERS only: GEMINI_API_KEY,
   UPSTASH_VECTOR_REST_URL, UPSTASH_VECTOR_REST_TOKEN, UPSTASH_REDIS_REST_URL,
   UPSTASH_REDIS_REST_TOKEN, RESEND_API_KEY. Never commit real secrets.

THEN — PHASE 1 (content site, the part that ships first)
6. Create routes: / (Great Hall home — a themed hero + intro for now, with a clearly
   marked mount point/TODO where the 3D castle will later go, AND a working text navigation
   that doubles as the accessible fallback), /projects and /projects/[slug], /about,
   /resume (themed page + a downloadable resume link placeholder), /contact.
7. Set up MDX (Contentlayer) for the four project case studies. Create stub MDX entries for:
   Aura, Solar-Connect, Arduino Day PH 2025, and a 4th UI/UX project (placeholder). Each:
   title, themed framing, problem, role, stack, outcome, links.
8. Build the "owl post" contact form UI with client-side validation + a honeypot; stub the
   Resend send behind an /api/contact route (no real key needed yet).
9. Implement the project "spellbook" cards, buttons, inputs, badges, and dialog using the
   design system's component styles — match the style guide's look and states.

STUB ONLY (don't fully build yet) — leave clean, typed interfaces + TODOs
- 3D castle nav hub (Phase 2): a <CastleHub/> component that will lazy-load R3F; for now it
  renders the 2D fallback hero. Document its props.
- The Sorting Hat (Phase 3): a <SortingHat/> chat-panel UI (no backend yet), a lib/rag/
  folder with typed stubs for ingest/retrieve/ask, and an /api/ask route returning a
  stubbed grounded answer + citations.
- Atmosphere (Phase 4): <MusicToggle/> (default OFF) and <WandCursor/> (desktop-only,
  reduced-motion aware, with an off switch) as stubbed components.

CONSTRAINTS (must follow)
- Accessibility (WCAG 2.1 AA): full keyboard nav, visible focus, reduced-motion variants,
  the 3D always has the text-nav fallback, music defaults OFF, the wand cursor has an off
  switch and is disabled on touch devices.
- Performance: lazy-load anything heavy (3D, audio); keep the content core fast.
- 2D/3D boundary: the design system (CSS/DOM) owns all UI; React Three Fiber owns the
  castle scene; the 3D scene consumes shared tokens (gold --accent, --accent-glow, the
  per-house glow triplets, --bg/--bg-sunken, and the motion easings).
- Security/cost: API keys server-side only; add a note in the README about setting a Gemini
  spend cap.
- Do NOT add paid services or real API keys — stub them and tell me when each is needed.

DELIVERABLES
- A running app (npm run dev) showing the themed Phase-1 content site.
- Tokens wired into Tailwind + CSS variables, the four fonts loaded, and house theming
  switchable by setting data-house on a subtree.
- A README.md summarizing what's done, the folder structure, how to run it, and the exact
  next steps for Phases 2–4.
- Use small, logical commits.

Ask me before any irreversible or paid-account decision. When Phase 1 runs cleanly, stop
and give me a short summary + how to preview it.
```
