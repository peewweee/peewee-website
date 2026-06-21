import { cn } from "@/lib/utils";

/** Consistent themed page intro: mono eyebrow, Cinzel title, serif lede. */
export function PageHeader({
  eyebrow,
  title,
  lede,
  className,
  children,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={cn("max-w-3xl", className)}>
      {eyebrow && (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-3 text-balance font-display text-4xl font-bold text-foreground sm:text-5xl">
        {title}
      </h1>
      {lede && (
        <p className="mt-4 text-pretty font-serif text-lg text-foreground-muted sm:text-xl">
          {lede}
        </p>
      )}
      {children}
    </header>
  );
}
