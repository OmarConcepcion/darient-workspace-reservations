import { useMemo, useState } from "react";

import { normalizeApiError } from "../../../shared/api/errors";
import {
  BuildingIcon,
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  SearchIcon,
  Skeleton,
  XIcon
} from "../../../shared/ui";
import { usePlaces, type Place } from "../../places";
import { SpaceCard } from "../components/SpaceCard";
import { useSpaces } from "../hooks/use-spaces";

type SortKey = "name_asc" | "name_desc" | "capacity_asc" | "capacity_desc";

const SORT_LABELS: Record<SortKey, string> = {
  name_asc: "Name (A–Z)",
  name_desc: "Name (Z–A)",
  capacity_asc: "Capacity (low–high)",
  capacity_desc: "Capacity (high–low)"
};

export const SpacesListView = () => {
  const spacesQuery = useSpaces();
  const placesQuery = usePlaces();

  const [search, setSearch] = useState("");
  const [placeFilter, setPlaceFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("name_asc");

  const placesById = useMemo(() => {
    const map = new Map<string, Place>();
    for (const place of placesQuery.data ?? []) {
      map.set(place.id, place);
    }
    return map;
  }, [placesQuery.data]);

  const filteredSpaces = useMemo(() => {
    const allSpaces = spacesQuery.data ?? [];
    const q = search.trim().toLowerCase();

    return allSpaces
      .filter((space) => {
        if (placeFilter !== "all" && space.placeId !== placeFilter) return false;
        if (q) {
          const inName = space.name.toLowerCase().includes(q);
          const inLocation = space.locationReference?.toLowerCase().includes(q) ?? false;
          const inDescription = space.description?.toLowerCase().includes(q) ?? false;
          if (!inName && !inLocation && !inDescription) return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sort) {
          case "name_asc":
            return a.name.localeCompare(b.name);
          case "name_desc":
            return b.name.localeCompare(a.name);
          case "capacity_asc":
            return a.capacity - b.capacity;
          case "capacity_desc":
            return b.capacity - a.capacity;
        }
      });
  }, [spacesQuery.data, search, placeFilter, sort]);

  const hasActiveFilters = search.trim() !== "" || placeFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setPlaceFilter("all");
  };

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Workspaces"
        title="Spaces"
        description="All bookable workspaces across configured places. View details, check capacity and find the right space for your needs."
      />

      {spacesQuery.isLoading ? (
        <SpacesSkeleton />
      ) : spacesQuery.isError ? (
        <ErrorState
          title="We couldn't load spaces"
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
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <SearchIcon size={15} />
              </span>
              <input
                type="text"
                placeholder="Search spaces by name or location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <select
              value={placeFilter}
              onChange={(e) => setPlaceFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="all">All places</option>
              {placesQuery.data?.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([key, label]) => (
                <option key={key} value={key}>
                  Sort: {label}
                </option>
              ))}
            </select>

            {hasActiveFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <XIcon size={14} />
                Clear filters
              </Button>
            ) : null}
          </div>

          <p className="text-sm text-slate-500">
            {filteredSpaces.length === (spacesQuery.data ?? []).length
              ? `${filteredSpaces.length} space${filteredSpaces.length !== 1 ? "s" : ""}`
              : `${filteredSpaces.length} of ${(spacesQuery.data ?? []).length} spaces`}
          </p>

          {filteredSpaces.length === 0 ? (
            <EmptyState
              icon={<SearchIcon size={20} />}
              title="No spaces match your search"
              description="Try adjusting your filters or search term."
              action={
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSpaces.map((space) => (
                <SpaceCard
                  key={space.id}
                  space={space}
                  place={placesById.get(space.placeId)}
                />
              ))}
            </div>
          )}
        </>
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
