import { Link } from "react-router-dom";
import type { ReactNode } from "react";

import { uiTerms } from "../../shared/i18n";
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
      eyebrow="Soporte"
      title="Ayuda"
      description="Accesos rápidos al contrato de la API, al stream IoT y al dashboard operativo."
      actions={
        <a
          href={swaggerUrl}
          target="_blank"
          rel="noreferrer"
          className={buttonClasses("primary", "md")}
        >
          {uiTerms.actions.openSwagger}
          <ArrowRightIcon size={16} />
        </a>
      }
    />

    <div className="grid gap-4 lg:grid-cols-3">
      <HelpCard
        icon={<ShieldIcon size={21} />}
        title="Referencia de API"
        description="Swagger lista los endpoints REST, payloads de request y respuestas de error normalizadas que usa esta aplicación."
      />
      <HelpCard
        icon={<ActivityIcon size={21} />}
        title="Stream IoT"
        description="El estado del header refleja la conexión SSE usada para telemetría, alertas y estado reportado del dispositivo."
      />
      <HelpCard
        icon={<ZapIcon size={21} />}
        title="Dashboard"
        description="El dashboard admin muestra snapshots de monitoreo, actualizaciones en vivo, estado deseado e historial de alertas."
      />
    </div>

    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <HelpCircleIcon size={20} />
          </span>
          <div>
            <h2 className="font-semibold text-slate-950">¿Necesitas contexto en vivo?</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Empieza con Swagger para revisar la forma de la API y luego abre el
              dashboard admin para inspeccionar telemetría y actualizaciones del dispositivo.
            </p>
          </div>
        </div>
        <Link to="/admin" className={buttonClasses("secondary", "md")}>
          {uiTerms.actions.openDashboard}
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
