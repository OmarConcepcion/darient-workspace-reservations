export { spacesApi } from "./api/spaces-api";
export {
  spacesQueryKeys,
  useSpace,
  useSpaceAvailability,
  useSpaces
} from "./hooks/use-spaces";
export {
  spaceAvailabilitySchema,
  spaceAvailabilityWireSchema,
  spaceSchema,
  spaceWireSchema,
  type Space,
  type SpaceAvailability
} from "./schemas/space";
export { SpacesListView } from "./pages/SpacesListView";
export { SpaceDetailView } from "./pages/SpaceDetailView";
export { SpaceCard } from "./components/SpaceCard";
