import type { HTMLAttributes } from "react";

import { cn } from "./cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};

export const Card = ({
  className,
  interactive = false,
  ...props
}: CardProps) => (
  <div
    className={cn(
      "rounded-2xl border border-slate-200/80 bg-white/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur-sm",
      interactive &&
        "transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.18)]",
      className
    )}
    {...props}
  />
);
