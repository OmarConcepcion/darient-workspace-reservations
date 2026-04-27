import { useMemo } from "react";

import { normalizeApiError } from "../../../shared/api/errors";
import {
  BuildingIcon,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton
} from "../../../shared/ui";
import { usePlaces, type Place } from "../../places";
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
    <section className="space-y-8">
      <PageHeader
        eyebrow="Workspaces"
        title="Spaces"
        description="All bookable workspaces across configured places."
      />

      {spacesQuery.isLoading ? (
        <SpacesSkeleton />
      ) : spacesQuery.isError ? (
        <ErrorState
          title="We couldn’t load spaces"
          message={normalizeApiError(spacesQuery.error).message}
          onRetry={() => spacesQuery.refetch()}
        />
      ) : (spacesQuery.data ?? []).length === 0 ? (
        <EmptyState
          icon={<BuildingIcon size={20} />}
          title="No spaces yet"
          description="Create a space from the backend or admin tooling to see it here."
        />
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
      <Skeleton key={index} className="h-44" />
    ))}
  </div>
);
