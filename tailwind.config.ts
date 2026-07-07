import type { Config } from "tailwindcss";

/**
 * Wizarding Design System → Tailwind theme.
 *
 * Every color points at a CSS variable defined in `app/globals.css`, so Tailwind
 * utilities (e.g. `bg-surface`, `text-foreground-muted`, `shadow-glow`) resolve
 * to the same tokens the design system uses — and house theming via
 * `data-house="…"` flows through automatically (it only swaps `--accent*`).
 *
 * Both the raw token names (bg, surface, accent, gold…) and shadcn/ui semantic
 * aliases (background, card, primary, ring…) are exposed so hand-built and
 * `npx shadcn add` components share one palette.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        /* ---- raw design tokens ---- */
        bg: {
          DEFAULT: "var(--bg)",
          elev: "var(--bg-elev)",
          sunken: "var(--bg-sunken)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
        },
        parchment: {
          DEFAULT: "var(--parchment)",
          2: "var(--parchment-2)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          muted: "var(--ink-muted)",
          faint: "var(--ink-faint)",
        },
        /* text-on-dark exposed as `foreground` to avoid clashing with the
           Tailwind `text-*` utility namespace */
        foreground: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
        },
        gold: {
          DEFAULT: "var(--gold)",
          hover: "var(--gold-hover)",
          press: "var(--gold-press)",
          ink: "var(--gold-ink)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          2: "var(--accent-2)",
          text: "var(--accent-text)",
          ink: "var(--accent-ink)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        focus: "var(--focus)",

        /* ---- shadcn/ui semantic aliases (mapped onto wizarding tokens) ---- */
        background: "var(--bg)",
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
          ink: "var(--border-ink)",
        },
        input: "var(--border)",
        ring: "var(--focus)",
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text)",
        },
        popover: {
          DEFAULT: "var(--surface-2)",
          foreground: "var(--text)",
        },
        primary: {
          DEFAULT: "var(--gold)",
          foreground: "var(--gold-ink)",
        },
        secondary: {
          DEFAULT: "var(--surface-2)",
          foreground: "var(--text)",
        },
        muted: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text-muted)",
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "#1a0e0c",
        },
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "ui-serif", "Georgia", "serif"],
        serif: ["var(--font-cormorant)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
        blackletter: ["var(--font-blackletter)", "var(--font-cinzel)", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 6px)",
        card: "14px",
        field: "10px",
        sunken: "12px",
        pill: "999px",
      },
      boxShadow: {
        glow: "0 0 14px rgba(var(--accent-glow), 0.35)",
        "glow-sm": "0 0 12px rgba(var(--accent-glow), 0.3)",
        "glow-lg": "0 0 26px rgba(var(--accent-glow), 0.55)",
        card: "0 12px 40px rgba(0,0,0,0.4), 0 0 30px rgba(var(--accent-glow), 0.2)",
        focus:
          "0 0 0 2px var(--bg), 0 0 0 4px var(--focus), 0 0 18px rgba(var(--accent-glow), 0.4)",
      },
      transitionTimingFunction: {
        float: "var(--ease-float)",
        "out-soft": "var(--ease-out-soft)",
        candle: "var(--ease-candle)",
        glide: "var(--ease-glide)",
      },
      transitionDuration: {
        unfurl: "900ms",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        candle: {
          "0%, 100%": { opacity: "1" },
          "45%": { opacity: "0.78" },
          "70%": { opacity: "0.92" },
        },
        unfurl: {
          from: { opacity: "0", transform: "translateY(10px) scaleY(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scaleY(1)" },
        },
        think: {
          "0%, 80%, 100%": { opacity: "0.25", transform: "translateY(0)" },
          "40%": { opacity: "1", transform: "translateY(-3px)" },
        },
        hatSway: {
          "0%, 100%": { transform: "rotate(-4deg)" },
          "50%": { transform: "rotate(4deg)" },
        },
        hatTalk: {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(0.4) translateY(1px)" },
        },
        hatBlink: {
          "0%, 90%, 100%": { transform: "scaleY(1)" },
          "95%": { transform: "scaleY(0.08)" },
        },
        hatGlow: {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "43%": { opacity: "0.78", filter: "brightness(1.18)" },
        },
        owlFloat: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        wingFlap: {
          "0%, 100%": { transform: "rotate(0)" },
          "50%": { transform: "rotate(-14deg)" },
        },
        tuftWiggle: {
          "0%, 100%": { transform: "rotate(0)" },
          "50%": { transform: "rotate(5deg)" },
        },
        mailBob: {
          "0%, 100%": { transform: "translateY(0) rotate(-3deg)" },
          "50%": { transform: "translateY(2px) rotate(3deg)" },
        },
      },
      animation: {
        float: "float 6s var(--ease-float) infinite",
        candle: "candle 4s var(--ease-candle) infinite",
        unfurl: "unfurl var(--dur-unfurl) var(--ease-out-soft) both",
        think: "think 1.4s var(--ease-candle) infinite",
        "hat-sway": "hatSway 3.6s ease-in-out infinite",
        "hat-talk": "hatTalk 2.4s ease-in-out infinite",
        "hat-blink": "hatBlink 4.2s infinite",
        "hat-glow": "hatGlow 2.6s infinite",
        "owl-float": "owlFloat 3.4s ease-in-out infinite",
        "wing-flap": "wingFlap 1.8s ease-in-out infinite",
        "tuft-wiggle": "tuftWiggle 3s ease-in-out infinite",
        "mail-bob": "mailBob 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
