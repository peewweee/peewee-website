import { cn } from "@/lib/utils";

/**
 * A magicui-style border beam: a light "comet" that travels around an element's
 * border, using our gold palette. Pure CSS (offset-path + keyframes). The parent
 * must be `relative` and `rounded-*`; the beam inherits its radius.
 */
export function BorderBeam({
  className,
  size = 60,
  duration = 5,
  delay = 0,
  borderRadius = 14,
}: {
  className?: string;
  /** Length of the comet, in px. */
  size?: number;
  /** Seconds for one lap. */
  duration?: number;
  /** Seconds to offset the start. */
  delay?: number;
  /** Corner radius of the travel path (match the parent's rounding). */
  borderRadius?: number;
}) {
  return (
    <div
      className={cn(
        "border-beam-container pointer-events-none absolute inset-0 rounded-[inherit]",
        className,
      )}
    >
      <div
        className="absolute aspect-square bg-gradient-to-l from-accent via-accent-text to-transparent"
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${borderRadius}px)`,
          animation: `border-beam ${duration}s linear ${delay}s infinite`,
        }}
      />
    </div>
  );
}
