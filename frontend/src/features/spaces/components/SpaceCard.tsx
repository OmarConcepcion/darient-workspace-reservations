import { motion } from "motion/react";
import { Link } from "react-router-dom";

import {
  ArrowRightIcon,
  Badge,
  BuildingIcon,
  Card,
  CpuIcon,
  MapPinIcon,
  UsersIcon
} from "../../../shared/ui";
import type { Place } from "../../places";
import type { Space } from "../schemas/space";

type SpaceCardProps = {
  space: Space;
  place?: Place;
  layout?: "grid" | "list";
};

export const SpaceCard = ({ space, place, layout = "grid" }: SpaceCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
  >
    <Link to={`/spaces/${space.id}`} className="group block h-full">
      <Card interactive className="h-full overflow-hidden">
        <div
          className={`flex h-full flex-col gap-5 p-6 sm:p-7 ${
            layout === "list" ? "lg:flex-row lg:items-center" : ""
          }`}
        >
          <header
            className={`flex items-start justify-between gap-4 ${
              layout === "list" ? "lg:min-w-80 lg:flex-1" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 shadow-sm ring-1 ring-brand-100">
                <BuildingIcon size={24} />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-xl font-semibold tracking-tight text-slate-950">
                  {space.name}
                </h3>
                <p className="mt-1 truncate text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  {place?.name ?? "Unknown place"}
                </p>
              </div>
            </div>
            <Badge tone="brand">
              <UsersIcon size={12} />
              Capacity {space.capacity}
            </Badge>
          </header>

          <div
            className={`space-y-3 text-sm text-slate-600 ${
              layout === "list" ? "lg:flex-[1.15]" : ""
            }`}
          >
            {space.locationReference ? (
              <p className="flex items-center gap-2">
                <MapPinIcon size={14} className="text-slate-400" />
                <span>{space.locationReference}</span>
              </p>
            ) : null}
            {space.description ? (
              <p className="line-clamp-2 text-slate-500">{space.description}</p>
            ) : null}
          </div>

          <footer
            className={`mt-auto flex flex-col gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between ${
              layout === "list" ? "lg:mt-0 lg:min-w-72 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0" : ""
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <CpuIcon size={12} className="text-slate-400" />
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                {space.iotOfficeId}
              </code>
            </span>
            <span className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white shadow-lg shadow-brand-700/20">
              View details
              <ArrowRightIcon
                size={14}
                className="transition group-hover:translate-x-0.5"
              />
            </span>
          </footer>
        </div>
      </Card>
    </Link>
  </motion.div>
);
