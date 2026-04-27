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
      "rounded-3xl border border-slate-200/75 bg-white/85 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.42)] backdrop-blur-sm",
      interactive &&
        "transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_24px_70px_-44px_rgba(79,70,229,0.45)]",
      className
    )}
    {...props}
  />
);
