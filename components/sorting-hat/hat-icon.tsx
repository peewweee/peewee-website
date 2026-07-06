/**
 * The Sorting Hat mark from the Wizarding Design System — a little animated hat
 * that sways, blinks, and "talks". `motion-reduce:animate-none` keeps it still
 * for users who prefer reduced motion.
 */
export function HatIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className="relative overflow-visible"
      aria-hidden
    >
      <g className="origin-bottom animate-hat-sway [transform-box:fill-box] motion-reduce:animate-none">
        {/* brim — dark base */}
        <path
          d="M5 40 Q8.5 42.6 13 40.8 Q18.5 43.8 24 41.8 Q29.5 43.8 35 41 Q39.5 42.6 43 40 C44.5 41.6 41.5 43.6 36 44.3 Q24 45.8 12 44.3 C6.8 43.5 3.8 41.8 5 40 Z"
          fill="#1f1408"
          stroke="#1f1408"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* brim — top */}
        <path
          d="M6.5 33.5 C2.5 35 1.5 38 5 40 Q8.5 42.6 13 40.8 Q18.5 43.8 24 41.8 Q29.5 43.8 35 41 Q39.5 42.6 43 40 C46.5 38 45.5 34.8 42 33.7 C38.5 35.7 31.5 36.6 24 36.6 C16.5 36.6 10.2 35.4 6.5 33.5 Z"
          fill="#6f4b30"
          stroke="#1f1408"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* cone — folded body */}
        <path
          d="M13 37 C11.5 30 13.5 20 17.5 13 C19 10.2 21 7.6 23 6.4 C25.5 3.2 29.5 2.8 32.5 4.4 C36.5 6.5 41 9.6 43 12.4 C44 14 43.2 15.5 41.4 15.1 C41.6 13.4 39.8 11.4 37 10 C34 8.5 30.8 8.3 29.2 9.9 C29.8 12.6 30.3 16.2 30.8 20 C31.4 26.5 32.2 32.5 33 37 C26 39 19.5 39 13 37 Z"
          fill="#6f4b30"
          stroke="#1f1408"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* shading / creases */}
        <path
          d="M26.3 19.5 C26.8 16.2 26.4 12.8 25 9.5 C27.8 11 30.6 13 32.2 15 C31.9 17.2 30.9 19.3 29.4 21.1 C28.4 20.7 27.3 20.2 26.3 19.5 Z"
          fill="#4c3420"
          opacity=".5"
        />
        <path
          d="M25 9.5 C26.3 12.8 26.7 16.2 26.3 19.5"
          stroke="#4c3420"
          strokeWidth="1.1"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M29.2 9.9 C31.2 8.7 34.3 9 37 10.4 C34.4 9.8 31.4 9.7 29.7 11 Z" fill="#4c3420" />
        <path
          d="M19 13.5 C17.9 17.5 17.8 21 19 24 C19.9 21 20 17.5 20.6 14.2 Z"
          fill="#4c3420"
          opacity=".5"
        />
        {/* eyes */}
        <g className="origin-center animate-hat-blink [transform-box:fill-box] motion-reduce:animate-none">
          <path
            d="M12.5 20.5 L21.5 24.5 L16 29.5 Z"
            fill="#1f1408"
            stroke="#1f1408"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M31.5 20.5 L23 24.5 L28.5 29.5 Z"
            fill="#1f1408"
            stroke="#1f1408"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </g>
        {/* nose */}
        <path
          d="M21.6 24.3 C21 27.2 21.2 29.6 22.2 31.3 L23 31.3 C23.9 29.6 23.9 27.2 23.4 24.4 Z"
          fill="#4c3420"
          stroke="#1f1408"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        {/* mouth */}
        <path
          d="M11 33.6 Q22.5 30.4 34 33.6 Q31.5 36.5 27 36.8 Q22.5 37.3 18 36.8 Q13.5 36.5 11 33.6 Z"
          fill="#1f1408"
          stroke="#1f1408"
          strokeWidth="1.2"
          strokeLinejoin="round"
          className="origin-center animate-hat-talk [transform-box:fill-box] motion-reduce:animate-none"
        />
      </g>
    </svg>
  );
}

/** A solid silhouette of the Sorting Hat — used for the castle map indicator. */
export function HatSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="currentColor" aria-hidden>
      <path d="M5 40 Q8.5 42.6 13 40.8 Q18.5 43.8 24 41.8 Q29.5 43.8 35 41 Q39.5 42.6 43 40 C44.5 41.6 41.5 43.6 36 44.3 Q24 45.8 12 44.3 C6.8 43.5 3.8 41.8 5 40 Z" />
      <path d="M6.5 33.5 C2.5 35 1.5 38 5 40 Q8.5 42.6 13 40.8 Q18.5 43.8 24 41.8 Q29.5 43.8 35 41 Q39.5 42.6 43 40 C46.5 38 45.5 34.8 42 33.7 C38.5 35.7 31.5 36.6 24 36.6 C16.5 36.6 10.2 35.4 6.5 33.5 Z" />
      <path d="M13 37 C11.5 30 13.5 20 17.5 13 C19 10.2 21 7.6 23 6.4 C25.5 3.2 29.5 2.8 32.5 4.4 C36.5 6.5 41 9.6 43 12.4 C44 14 43.2 15.5 41.4 15.1 C41.6 13.4 39.8 11.4 37 10 C34 8.5 30.8 8.3 29.2 9.9 C29.8 12.6 30.3 16.2 30.8 20 C31.4 26.5 32.2 32.5 33 37 C26 39 19.5 39 13 37 Z" />
    </svg>
  );
}

/** Glowing round avatar housing the Hat. */
export function HatAvatar({ size = 40 }: { size?: number }) {
  return (
    <div
      className="relative flex flex-none items-center justify-center rounded-full border border-accent"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 50% 38%, #1d2342, #0b1026)",
        boxShadow: "0 0 16px rgba(var(--accent-glow), 0.42)",
      }}
    >
      <span
        className="absolute inset-0 rounded-full animate-hat-glow motion-reduce:animate-none"
        style={{
          background:
            "radial-gradient(circle, rgba(var(--accent-glow), 0.26), transparent 70%)",
        }}
      />
      <HatIcon size={Math.round(size * 0.78)} />
    </div>
  );
}
