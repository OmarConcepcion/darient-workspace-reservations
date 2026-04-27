import { useMemo } from "react";

import { usePlaces, type Place } from "../../places";
import { normalizeApiError } from "../../../shared/api/errors";
import { SpaceCard } from "../components/SpaceCard";
import { useSpaces } from "../hooks/use-spaces";

export const SpacesListView = () => {
  const spacesQuery = useSpaces();
  const placesQuery = usePlaces();

  const placesById = useMemo(() => {
    const map = new Map<string, Place>();
    for (const place of placesQuery.data ?? []) {
      map.set(place.id, place);
    }
    return map;
  }, [placesQuery.data]);

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Spaces</h1>
        <p className="text-sm text-slate-600">
          All bookable workspaces across configured places.
        </p>
      </header>

      {spacesQuery.isLoading ? (
        <SpacesSkeleton />
      ) : spacesQuery.isError ? (
        <ErrorState
          message={normalizeApiError(spacesQuery.error).message}
          onRetry={() => spacesQuery.refetch()}
        />
      ) : (spacesQuery.data ?? []).length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spacesQuery.data?.map((space) => (
            <SpaceCard
              key={space.id}
              space={space}
              place={placesById.get(space.placeId)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

const SpacesSkeleton = () => (
  <div
    aria-busy="true"
    aria-label="Loading spaces"
    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
  >
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="h-36 animate-pulse rounded-lg border border-slate-200 bg-white"
      />
    ))}
  </div>
);

const EmptyState = () => (
  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
    <h2 className="text-base font-semibold text-slate-900">No spaces yet</h2>
    <p className="mt-1 text-sm text-slate-600">
      Create a space from the backend to see it here.
    </p>
  </div>
);

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <div
    role="alert"
    className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-800"
  >
    <h2 className="text-base font-semibold">We couldn’t load spaces</h2>
    <p className="mt-1 text-sm">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-4 inline-flex items-center rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-rose-700"
    >
      Retry
    </button>
  </div>
);
