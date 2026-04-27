import { motion } from "motion/react";
import { Link, useParams } from "react-router-dom";

import { normalizeApiError } from "../../../shared/api/errors";
import {
  Badge,
  BuildingIcon,
  Card,
  ChevronLeftIcon,
  CpuIcon,
  ErrorState,
  Skeleton,
  UsersIcon
} from "../../../shared/ui";
import { usePlace } from "../../places";
import { useSpace } from "../hooks/use-spaces";

export const SpaceDetailView = () => {
  const { space_id: spaceId } = useParams<{ space_id: string }>();
  const spaceQuery = useSpace(spaceId);
  const placeQuery = usePlace(spaceQuery.data?.placeId);

  return (
    <section className="space-y-8">
      <Link
        to="/spaces"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ChevronLeftIcon size={16} />
        Back to spaces
      </Link>

      {spaceQuery.isLoading ? (
        <Skeleton className="h-72" aria-busy="true" aria-label="Loading space" />
      ) : spaceQuery.isError ? (
        <ErrorState
          title="Space not available"
          message={normalizeApiError(spaceQuery.error).message}
        />
      ) : spaceQuery.data ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <Card>
            <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-brand-50 via-white to-fuchsia-50/40 px-8 py-10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-16 -right-10 h-44 w-44 rounded-full bg-brand-200/40 blur-3xl"
              />
              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-brand-100">
                    <BuildingIcon size={22} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                      {placeQuery.data?.name ?? "Place pending…"}
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                      {spaceQuery.data.name}
                    </h1>
                  </div>
                </div>
                <Badge tone="brand" className="self-start sm:self-auto">
                  <UsersIcon size={12} />
                  Capacity {spaceQuery.data.capacity}
                </Badge>
              </div>
            </div>

            <dl className="grid gap-x-8 gap-y-5 px-8 py-8 sm:grid-cols-2">
              <DetailField label="Location reference">
                {spaceQuery.data.locationReference ?? "—"}
              </DetailField>
              <DetailField label="IoT office id">
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  <CpuIcon size={14} className="text-slate-400" />
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
                    {spaceQuery.data.iotOfficeId}
                  </code>
                </span>
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
          </Card>
        </motion.div>
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
    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
      {label}
    </dt>
    <dd className="mt-1.5 text-sm text-slate-900">{children}</dd>
  </div>
);
