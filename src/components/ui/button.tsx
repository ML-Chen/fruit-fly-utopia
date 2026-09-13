import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[transform,background-color,color,border-color,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96] [&_svg]:pointer-events-none [&_svg]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:bg-fg",
        ghost:
          "bg-transparent text-fg border border-border hover:border-border-strong hover:bg-surface-2",
        subtle: "bg-surface-2 text-fg hover:bg-surface",
        danger: "bg-danger text-fg hover:opacity-90",
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-sm",
        md: "h-11 px-4 text-sm rounded-md",
        lg: "h-12 px-5 text-base rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
