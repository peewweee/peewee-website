import { cn } from "@/lib/utils";

/**
 * CastleBrewing — a 2D "brewing" loader that covers the hero while the heavy
 * three.js castle chunk downloads and paints (the gap where "Welcome, wizard!"
 * is up but the 3D scene hasn't appeared yet). A cauldron with a glowing potion,
 * rising bubbles, and drifting steam; it adopts the active house accent.
 *
 * Shown ONLY for plain / first-visit entries — never when arriving via the
 * back-to-castle iris (that transition already covers the load). See castle-hub.
 * `done` fades it out (opacity) once the scene reports ready.
 */

/** Bubbles rising off the potion surface — varied x, size, and stagger. */
const BUBBLES = [
  { left: 53, size: 7, delay: "0s" },
  { left: 65, size: 5, delay: "0.5s" },
  { left: 75, size: 8, delay: "0.9s" },
  { left: 86, size: 6, delay: "1.3s" },
  { left: 96, size: 5, delay: "1.7s" },
];

export function CastleBrewing({ done }: { done: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        // fixed inset-0 fills the WHOLE viewport — including over the sticky site
        // header (z-40) — so nothing but the brewing screen shows while loading.
        // z-50 also clears the castle's drei <Html> labels (zIndexRange max 20) and
        // the Sorting Hat map pin (max 40), whose inline z-indexes would otherwise
        // punch through (the pin appeared before the brew faded).
        "pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 bg-[var(--bg)] transition-opacity duration-700 ease-out",
        done ? "opacity-0" : "opacity-100",
      )}
    >
      <div className="relative h-[130px] w-[150px]">
        {/* Potion glow — a soft accent halo that pulses above/behind the rim. */}
        <div className="castle-brew-glow absolute left-1/2 top-[26px] h-8 w-24 rounded-full bg-accent blur-2xl" />

        {/* Cauldron */}
        <svg
          viewBox="0 0 150 130"
          className="relative h-full w-full drop-shadow-[0_8px_18px_rgba(0,0,0,0.5)]"
        >
          <defs>
            <radialGradient id="brewPotion" cx="50%" cy="30%" r="75%">
              <stop offset="0%" stopColor="var(--accent-text)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </radialGradient>
            <linearGradient id="brewIron" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2b2517" />
              <stop offset="100%" stopColor="#120e08" />
            </linearGradient>
          </defs>

          {/* Feet */}
          <path d="M50 103 l-7 17 h10 l4 -13 z" fill="#120e08" />
          <path d="M100 103 l7 17 h-10 l-4 -13 z" fill="#120e08" />

          {/* Body */}
          <path
            d="M26 55 Q22 105 75 109 Q128 105 124 55 Z"
            fill="url(#brewIron)"
            stroke="#4a3d24"
            strokeWidth="1.5"
          />
          {/* Side handles */}
          <path
            d="M26 63 Q13 67 17 84"
            fill="none"
            stroke="#4a3d24"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M124 63 Q137 67 133 84"
            fill="none"
            stroke="#4a3d24"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Rim */}
          <ellipse
            cx="75"
            cy="53"
            rx="52"
            ry="14"
            fill="#241d12"
            stroke="#5a4a2c"
            strokeWidth="1.5"
          />
          {/* Potion surface + highlight */}
          <ellipse cx="75" cy="51" rx="44" ry="10" fill="url(#brewPotion)" />
          <ellipse
            cx="66"
            cy="48"
            rx="15"
            ry="3.2"
            fill="var(--accent-text)"
            opacity="0.55"
          />
        </svg>

        {/* Bubbles — rise off the potion surface and pop (in front of the pot). */}
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="castle-brew-bubble absolute rounded-full bg-accent-text"
            style={{
              left: b.left,
              top: 46,
              width: b.size,
              height: b.size,
              animationDelay: b.delay,
            }}
          />
        ))}

      </div>

      {/* Simple loading indicator — three pulsing dots, no text. */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 animate-think rounded-full bg-accent-text"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}
