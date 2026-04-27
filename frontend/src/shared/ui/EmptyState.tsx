import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export const EmptyState = ({
  icon,
  title,
  description,
  action
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300/80 bg-white/60 px-8 py-14 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-100">
      {icon}
    </div>
    <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
    {description ? (
      <p className="mt-1 max-w-sm text-sm text-slate-600">{description}</p>
    ) : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);
