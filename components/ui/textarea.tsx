import * as React from "react";

import { cn } from "@/lib/utils";

/** Multi-line text input — matches Input's design-system styling. */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[120px] w-full resize-y rounded-field border border-border bg-bg-sunken px-3.5 py-2.5 font-sans text-[15px] text-foreground transition-colors",
        "placeholder:text-foreground-faint",
        "focus-visible:border-accent focus-visible:shadow-focus focus-visible:outline-none",
        "aria-[invalid=true]:border-[var(--danger)]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
