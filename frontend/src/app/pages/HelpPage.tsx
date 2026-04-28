import { Link } from "react-router-dom";
import type { ReactNode } from "react";

import {
  ActivityIcon,
  ArrowRightIcon,
  Card,
  HelpCircleIcon,
  PageHeader,
  ShieldIcon,
  ZapIcon,
  buttonClasses
} from "../../shared/ui";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";
const swaggerUrl = `${apiBaseUrl.replace(/\/$/, "")}/docs`;

export const HelpPage = () => (
  <section className="space-y-8">
    <PageHeader
      eyebrow="Support"
      title="Help"
      description="Quick links for the API contract, IoT stream and operational dashboard."
      actions={
        <a
          href={swaggerUrl}
          target="_blank"
          rel="noreferrer"
          className={buttonClasses("primary", "md")}
        >
          Open Swagger
          <ArrowRightIcon size={16} />
        </a>
      }
    />

    <div className="grid gap-4 lg:grid-cols-3">
      <HelpCard
        icon={<ShieldIcon size={21} />}
        title="API reference"
        description="Swagger lists the REST endpoints, request payloads and normalized error responses used by this app."
      />
      <HelpCard
        icon={<ActivityIcon size={21} />}
        title="IoT stream"
        description="The header status reflects the SSE connection used for telemetry, alerts and reported device state."
      />
      <HelpCard
        icon={<ZapIcon size={21} />}
        title="Dashboard"
        description="The admin dashboard shows monitoring snapshots, live chart updates, desired state and alert history."
      />
    </div>

    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <HelpCircleIcon size={20} />
          </span>
          <div>
            <h2 className="font-semibold text-slate-950">Need live context?</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Start with Swagger for API shape, then open the admin dashboard to
              inspect telemetry and device-state updates.
            </p>
          </div>
        </div>
        <Link to="/admin" className={buttonClasses("secondary", "md")}>
          Open dashboard
        </Link>
      </div>
    </Card>
  </section>
);

const HelpCard = ({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) => (
  <Card className="p-6">
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
      {icon}
    </span>
    <h2 className="mt-5 font-semibold text-slate-950">{title}</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
  </Card>
);
