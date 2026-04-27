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
};

export const SpaceCard = ({ space, place }: SpaceCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
  >
    <Link to={`/spaces/${space.id}`} className="group block h-full">
      <Card interactive className="h-full">
        <div className="flex h-full flex-col gap-4 p-6">
          <header className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <BuildingIcon size={18} />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-slate-900">
                  {space.name}
                </h3>
                <p className="truncate text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  {place?.name ?? "Unknown place"}
                </p>
              </div>
            </div>
            <Badge tone="brand">
              <UsersIcon size={12} />
              Capacity {space.capacity}
            </Badge>
          </header>

          <div className="space-y-2 text-sm text-slate-600">
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

          <footer className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CpuIcon size={12} className="text-slate-400" />
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                {space.iotOfficeId}
              </code>
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-brand-700">
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
