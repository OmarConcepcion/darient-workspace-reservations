import type { ReactNode } from "react";

import { Button } from "./Button";
import { AlertCircleIcon, RefreshIcon } from "./icons";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  action?: ReactNode;
};

export const ErrorState = ({
  title = "Something went wrong",
  message,
  onRetry,
  action
}: ErrorStateProps) => (
  <div
    role="alert"
    className="flex flex-col items-start gap-4 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-6 text-rose-900"
  >
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600 ring-1 ring-rose-200">
        <AlertCircleIcon size={18} />
      </span>
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-rose-800/90">{message}</p>
      </div>
    </div>
    {(onRetry || action) && (
      <div className="flex gap-2">
        {onRetry ? (
          <Button variant="danger" size="sm" onClick={onRetry}>
            <RefreshIcon size={14} />
            Retry
          </Button>
        ) : null}
        {action}
      </div>
    )}
  </div>
);
