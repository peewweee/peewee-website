import * as React from "react";

import { cn } from "@/lib/utils";

/** Text input — design-system styled, with focus + invalid + disabled states. */
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "w-full rounded-field border border-border bg-bg-sunken px-3.5 py-2.5 font-sans text-[15px] text-foreground transition-colors",
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
Input.displayName = "Input";

export { Input };
