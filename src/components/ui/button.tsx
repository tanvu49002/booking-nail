import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

type ButtonSize = "default" | "sm" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

const variants: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
  destructive:
    "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20",
  outline:
    "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3",
  lg: "h-10 rounded-md px-6",
  icon: "h-9 w-9",
};

function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      data-slot="button"
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}

export { Button, buttonVariants };
