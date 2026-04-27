import type { HTMLAttributes } from "react";

import { cn } from "./cn";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "muted";

const toneStyles: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  warning: "bg-amber-50 text-amber-800 ring-amber-100",
  danger: "bg-rose-50 text-rose-700 ring-rose-100",
  muted: "bg-slate-50 text-slate-500 ring-slate-200"
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export const Badge = ({
  tone = "neutral",
  className,
  ...props
}: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
      toneStyles[tone],
      className
    )}
    {...props}
  />
);
