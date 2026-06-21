import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">404</p>
      <h1 className="mt-3 font-display text-4xl font-bold text-foreground sm:text-5xl">
        This room has vanished
      </h1>
      <p className="mt-4 max-w-md text-foreground-muted">
        Like the Room of Requirement when it isn&rsquo;t needed, the page you&rsquo;re
        looking for isn&rsquo;t here. Let&rsquo;s get you back to the castle.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Return to the Great Hall</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/projects">Browse projects</Link>
        </Button>
      </div>
    </div>
  );
}
