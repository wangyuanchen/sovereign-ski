import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm text-on-surface placeholder:text-white/30 transition-all focus-visible:outline-none focus-visible:border-accent/40 focus-visible:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:shadow-[0_0_20px_rgb(var(--accent)_/_0.1)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
