import { motion } from "motion/react";
import { Link, useParams } from "react-router-dom";

import { usePlace } from "../../places";
import { normalizeApiError } from "../../../shared/api/errors";
import { useSpace } from "../hooks/use-spaces";

export const SpaceDetailView = () => {
  const { space_id: spaceId } = useParams<{ space_id: string }>();
  const spaceQuery = useSpace(spaceId);
  const placeQuery = usePlace(spaceQuery.data?.placeId);

  return (
    <section className="space-y-6">
      <nav className="text-sm">
        <Link to="/spaces" className="text-slate-500 hover:text-slate-900">
          ← Back to spaces
        </Link>
      </nav>

      {spaceQuery.isLoading ? (
        <div
          aria-busy="true"
          aria-label="Loading space"
          className="h-64 animate-pulse rounded-lg border border-slate-200 bg-white"
        />
      ) : spaceQuery.isError ? (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-800"
        >
          <h1 className="text-lg font-semibold">Space not available</h1>
          <p className="mt-1 text-sm">
            {normalizeApiError(spaceQuery.error).message}
          </p>
        </div>
      ) : spaceQuery.data ? (
        <motion.article
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <header className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {spaceQuery.data.name}
              </h1>
              <p className="text-sm text-slate-500">
                {placeQuery.data?.name ?? "Place pending…"}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              Capacity {spaceQuery.data.capacity}
            </span>
          </header>

          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Location reference">
              {spaceQuery.data.locationReference ?? "—"}
            </DetailField>
            <DetailField label="IoT office id">
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                {spaceQuery.data.iotOfficeId}
              </code>
            </DetailField>
            {placeQuery.data ? (
              <DetailField label="Timezone">
                {placeQuery.data.timezone}
              </DetailField>
            ) : null}
            <DetailField label="Created at">
              {new Date(spaceQuery.data.createdAt).toLocaleString()}
            </DetailField>
            <DetailField label="Description" full>
              {spaceQuery.data.description ?? "—"}
            </DetailField>
          </dl>
        </motion.article>
      ) : null}
    </section>
  );
};

type DetailFieldProps = {
  label: string;
  children: React.ReactNode;
  full?: boolean;
};

const DetailField = ({ label, children, full = false }: DetailFieldProps) => (
  <div className={full ? "sm:col-span-2" : undefined}>
    <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="mt-1 text-sm text-slate-900">{children}</dd>
  </div>
);
