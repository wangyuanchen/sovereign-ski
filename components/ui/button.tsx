import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-accent to-accent-light text-surface shadow-[0_4px_20px_rgb(var(--accent)_/_0.35)] hover:shadow-[0_6px_35px_rgb(var(--accent)_/_0.5)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_12px_rgb(var(--accent)_/_0.3)]",
        outline:
          "border border-white/15 bg-white/[0.04] text-on-surface backdrop-blur-sm hover:border-accent/40 hover:bg-white/[0.08] hover:shadow-[0_0_30px_rgb(var(--accent)_/_0.15)] active:bg-white/[0.12]",
        ghost: "text-on-surface hover:bg-white/[0.06] hover:shadow-[0_0_18px_rgb(var(--accent)_/_0.1)] active:bg-white/[0.08]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-10 rounded-lg px-4",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
