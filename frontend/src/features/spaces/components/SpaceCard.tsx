import { motion } from "motion/react";
import { Link } from "react-router-dom";

import type { Place } from "../../places";
import type { Space } from "../schemas/space";

type SpaceCardProps = {
  space: Space;
  place?: Place;
};

export const SpaceCard = ({ space, place }: SpaceCardProps) => (
  <motion.article
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.18, ease: "easeOut" }}
    className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
  >
    <header className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{space.name}</h3>
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {place?.name ?? "Unknown place"}
        </p>
      </div>
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
        Capacity {space.capacity}
      </span>
    </header>

    {space.locationReference ? (
      <p className="mb-2 text-sm text-slate-600">{space.locationReference}</p>
    ) : null}

    {space.description ? (
      <p className="mb-4 line-clamp-2 text-sm text-slate-500">{space.description}</p>
    ) : null}

    <footer className="flex items-center justify-between text-xs text-slate-500">
      <span>
        IoT&nbsp;<code className="rounded bg-slate-100 px-1.5 py-0.5">{space.iotOfficeId}</code>
      </span>
      <Link
        to={`/spaces/${space.id}`}
        className="font-medium text-slate-900 transition group-hover:underline"
      >
        View details →
      </Link>
    </footer>
  </motion.article>
);
