import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium leading-5",
  {
    variants: {
      tone: {
        slate: "border-slate-200 bg-slate-50 text-slate-700",
        green: "border-emerald-200 bg-emerald-50 text-emerald-700",
        amber: "border-amber-200 bg-amber-50 text-amber-700",
        red: "border-red-200 bg-red-50 text-red-700",
        blue: "border-sky-200 bg-sky-50 text-sky-700",
        muted: "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]",
      },
    },
    defaultVariants: {
      tone: "slate",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, className }))} {...props} />;
}

