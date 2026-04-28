import { useDeferredValue, useMemo, useState } from "react";

import {
  pluralizeSpanish,
  uiTerms
} from "../../../shared/i18n";
import { normalizeApiError } from "../../../shared/api/errors";
import {
  BuildingIcon,
  Button,
  Card,
  ChevronDownIcon,
  EmptyState,
  ErrorState,
  LayersIcon,
  PageHeader,
  SearchIcon,
  Skeleton,
  XIcon
} from "../../../shared/ui";
import { usePlaces, type Place } from "../../places";
import { SpaceCard } from "../components/SpaceCard";
import { useSpaces } from "../hooks/use-spaces";

type SortKey = "name_asc" | "name_desc" | "capacity_asc" | "capacity_desc";
type ViewMode = "grid" | "list";

const SORT_LABELS: Record<SortKey, string> = {
  name_asc: "Nombre (A–Z)",
  name_desc: "Nombre (Z–A)",
  capacity_asc: "Capacidad (menor a mayor)",
  capacity_desc: "Capacidad (mayor a menor)"
};

export const SpacesListView = () => {
  const spacesQuery = useSpaces();
  const placesQuery = usePlaces();

  const [search, setSearch] = useState("");
  const [placeFilter, setPlaceFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("name_asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const deferredSearch = useDeferredValue(search);

  const placesById = useMemo(() => {
    const map = new Map<string, Place>();
    for (const place of placesQuery.data ?? []) {
      map.set(place.id, place);
    }
    return map;
  }, [placesQuery.data]);

  const locationOptions = useMemo(() => {
    const locations = new Set<string>();
    for (const space of spacesQuery.data ?? []) {
      if (space.locationReference) locations.add(space.locationReference);
    }
    return Array.from(locations).sort((a, b) => a.localeCompare(b));
  }, [spacesQuery.data]);

  const filteredSpaces = useMemo(() => {
    const allSpaces = spacesQuery.data ?? [];
    const q = deferredSearch.trim().toLowerCase();

    return allSpaces
      .filter((space) => {
        if (placeFilter !== "all" && space.placeId !== placeFilter) return false;
        if (locationFilter !== "all" && space.locationReference !== locationFilter) {
          return false;
        }
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
  }, [spacesQuery.data, deferredSearch, placeFilter, locationFilter, sort]);

  const hasActiveFilters =
    search.trim() !== "" || placeFilter !== "all" || locationFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setPlaceFilter("all");
    setLocationFilter("all");
  };

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Oficinas"
        title="Oficinas"
        description="Todas las oficinas reservables en los lugares configurados. Revisa detalles, capacidad y encuentra el espacio adecuado sin fricción."
      />

      {spacesQuery.isLoading ? (
        <SpacesSkeleton />
      ) : spacesQuery.isError ? (
        <ErrorState
          title="No pudimos cargar las oficinas"
          message={normalizeApiError(spacesQuery.error).message}
          onRetry={() => spacesQuery.refetch()}
        />
      ) : (spacesQuery.data ?? []).length === 0 ? (
        <EmptyState
          icon={<BuildingIcon size={20} />}
          title="No hay oficinas todavía"
          description="Crea una oficina desde el backend o las herramientas admin para verla aquí."
        />
      ) : (
        <>
          <Card className="p-4 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_auto_auto_auto_auto]">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <SearchIcon size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Buscar oficinas por nombre o ubicación..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-800 shadow-sm shadow-slate-900/[0.02] placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
                />
              </div>

              <FilterSelect
                label="Lugar"
                value={placeFilter}
                onChange={setPlaceFilter}
                icon={<BuildingIcon size={17} />}
              >
                <option value="all">Todos los lugares</option>
                {placesQuery.data?.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.name}
                  </option>
                ))}
              </FilterSelect>

              <FilterSelect
                label="Piso"
                value={locationFilter}
                onChange={setLocationFilter}
                icon={<LayersIcon size={17} />}
              >
                <option value="all">Todos los pisos</option>
                {locationOptions.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </FilterSelect>

              <FilterSelect
                label="Ordenar por"
                value={sort}
                onChange={(value) => setSort(value as SortKey)}
                icon={<ChevronDownIcon size={17} />}
              >
                {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </FilterSelect>

              <Button
                variant={hasActiveFilters ? "secondary" : "ghost"}
                size="md"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="justify-center"
              >
                <XIcon size={15} />
                {uiTerms.actions.clearFilters}
              </Button>
            </div>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-600">
              {filteredSpaces.length === (spacesQuery.data ?? []).length
                ? pluralizeSpanish(
                    filteredSpaces.length,
                    uiTerms.nouns.space,
                    uiTerms.nouns.spacePlural
                  )
                : `${filteredSpaces.length} de ${(spacesQuery.data ?? []).length} ${uiTerms.nouns.spacePlural}`}
            </p>
            <div className="inline-flex w-fit rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              {(["grid", "list"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`min-h-10 rounded-xl px-4 text-xs font-bold capitalize transition ${
                    viewMode === mode
                      ? "bg-brand-50 text-brand-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {mode === "grid" ? "cuadrícula" : "lista"}
                </button>
              ))}
            </div>
          </div>

          {filteredSpaces.length === 0 ? (
            <EmptyState
              icon={<SearchIcon size={20} />}
              title="No hay oficinas que coincidan con tu búsqueda"
              description="Prueba ajustando los filtros o el término de búsqueda."
              action={
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  {uiTerms.actions.clearFilters}
                </Button>
              }
            />
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-5 lg:grid-cols-2 2xl:grid-cols-3"
                  : "grid gap-5"
              }
            >
              {filteredSpaces.map((space) => (
                <SpaceCard
                  key={space.id}
                  space={space}
                  place={placesById.get(space.placeId)}
                  layout={viewMode}
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
    aria-label={uiTerms.a11y.loadingSpaces}
    className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3"
  >
    {Array.from({ length: 6 }).map((_, index) => (
      <Skeleton key={index} className="h-56" />
    ))}
  </div>
);

type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
};

const FilterSelect = ({
  label,
  value,
  onChange,
  icon,
  children
}: FilterSelectProps) => (
  <label className="relative min-w-0 lg:min-w-44">
    <span className="sr-only">{label}</span>
    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-500">
      {icon}
    </span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white py-2 pl-11 pr-9 text-sm font-medium text-slate-800 shadow-sm shadow-slate-900/[0.02] focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
    >
      {children}
    </select>
    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
      <ChevronDownIcon size={16} />
    </span>
  </label>
);
