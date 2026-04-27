import { PrismaPlaceRepository } from "../modules/places/infrastructure/prisma-place-repository.js";
import type { PlaceRepository } from "../modules/places/ports/place-repository.js";
import { PrismaSpaceRepository } from "../modules/spaces/infrastructure/prisma-space-repository.js";
import type { SpaceRepository } from "../modules/spaces/ports/space-repository.js";

export type AppDependencies = {
  placeRepository: PlaceRepository;
  spaceRepository: SpaceRepository;
};

export const createDefaultDependencies = (): AppDependencies => ({
  placeRepository: new PrismaPlaceRepository(),
  spaceRepository: new PrismaSpaceRepository()
});
