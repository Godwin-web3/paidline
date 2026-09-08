import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-transform duration-150 ease-out disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:opacity-90",
        ink: "bg-ink text-paper hover:opacity-90",
        ghost: "bg-transparent text-fg border border-line hover:border-line-strong hover:bg-raised",
        danger: "bg-transparent text-bad border border-bad/40 hover:bg-bad/10",
      },
      size: {
        md: "h-11 px-4 text-sm rounded-md",
        sm: "h-9 px-3 text-xs rounded-sm",
        lg: "h-12 px-5 text-sm rounded-md",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
