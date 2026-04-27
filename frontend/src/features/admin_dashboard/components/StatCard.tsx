import type { ReactNode } from "react";

import { Card, cn } from "../../../shared/ui";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "brand" | "warning" | "danger";
};

const toneAccent: Record<NonNullable<StatCardProps["tone"]>, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  danger: "bg-rose-50 text-rose-700 ring-rose-100"
};

export const StatCard = ({
  label,
  value,
  hint,
  icon,
  tone = "neutral"
}: StatCardProps) => (
  <Card>
    <div className="flex h-full flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          {label}
        </p>
        {icon ? (
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-2xl ring-1",
              toneAccent[tone]
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  </Card>
);
