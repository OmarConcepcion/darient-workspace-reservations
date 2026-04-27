import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export const PageHeader = ({
  eyebrow,
  title,
  description,
  actions
}: PageHeaderProps) => (
  <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="space-y-1">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-sm text-slate-600">{description}</p>
      ) : null}
    </div>
    {actions ? <div className="flex flex-shrink-0 gap-2">{actions}</div> : null}
  </header>
);
