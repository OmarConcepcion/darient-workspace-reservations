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
  <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
    <div className="max-w-3xl space-y-2">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-base leading-7 text-slate-600">
          {description}
        </p>
      ) : null}
    </div>
    {actions ? (
      <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row">
        {actions}
      </div>
    ) : null}
  </header>
);
