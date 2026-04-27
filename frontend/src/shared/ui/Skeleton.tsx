import type { HTMLAttributes } from "react";

import { cn } from "./cn";

export const Skeleton = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "animate-pulse rounded-xl bg-gradient-to-br from-slate-100 via-slate-200/70 to-slate-100",
      className
    )}
    {...props}
  />
);
