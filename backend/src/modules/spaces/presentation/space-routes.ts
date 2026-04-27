import { Router } from "express";

import { asyncHandler } from "../../../shared/http/async-handler.js";
import type { PlaceRepository } from "../../places/ports/place-repository.js";
import { SpaceService } from "../application/space-service.js";
import type { SpaceRepository } from "../ports/space-repository.js";
import {
  createSpaceSchema,
  spaceIdParamsSchema,
  updateSpaceSchema
} from "./space-schemas.js";
import { toSpaceResponse } from "./space-mapper.js";

export const createSpaceRouter = (
  spaceRepository: SpaceRepository,
  placeRepository: PlaceRepository
): Router => {
  const router = Router();
  const spaceService = new SpaceService(spaceRepository, placeRepository);

  router.get(
    "/",
    asyncHandler(async (_request, response) => {
      const spaces = await spaceService.list();
      response.json({ data: spaces.map(toSpaceResponse) });
    })
  );

  router.get(
    "/:space_id",
    asyncHandler(async (request, response) => {
      const { space_id: spaceId } = spaceIdParamsSchema.parse(request.params);
      const space = await spaceService.get(spaceId);
      response.json(toSpaceResponse(space));
    })
  );

  router.post(
    "/",
    asyncHandler(async (request, response) => {
      const input = createSpaceSchema.parse(request.body);
      const space = await spaceService.create({
        placeId: input.place_id,
        iotOfficeId: input.iot_office_id,
        name: input.name,
        locationReference: input.location_reference ?? null,
        capacity: input.capacity,
        description: input.description ?? null
      });

      response.status(201).json(toSpaceResponse(space));
    })
  );

  router.patch(
    "/:space_id",
    asyncHandler(async (request, response) => {
      const { space_id: spaceId } = spaceIdParamsSchema.parse(request.params);
      const input = updateSpaceSchema.parse(request.body);
      const space = await spaceService.update(spaceId, {
        placeId: input.place_id,
        iotOfficeId: input.iot_office_id,
        name: input.name,
        locationReference: input.location_reference,
        capacity: input.capacity,
        description: input.description
      });

      response.json(toSpaceResponse(space));
    })
  );

  router.delete(
    "/:space_id",
    asyncHandler(async (request, response) => {
      const { space_id: spaceId } = spaceIdParamsSchema.parse(request.params);
      await spaceService.delete(spaceId);
      response.status(204).send();
    })
  );

  return router;
};
