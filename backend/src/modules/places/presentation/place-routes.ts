import { Router } from "express";

import { asyncHandler } from "../../../shared/http/async-handler.js";
import type { PlaceRepository } from "../ports/place-repository.js";
import { PlaceService } from "../application/place-service.js";
import {
  createPlaceSchema,
  placeIdParamsSchema,
  updatePlaceSchema
} from "./place-schemas.js";
import { toPlaceResponse } from "./place-mapper.js";

export const createPlaceRouter = (placeRepository: PlaceRepository): Router => {
  const router = Router();
  const placeService = new PlaceService(placeRepository);

  router.get(
    "/",
    asyncHandler(async (_request, response) => {
      const places = await placeService.list();
      response.json({ data: places.map(toPlaceResponse) });
    })
  );

  router.get(
    "/:place_id",
    asyncHandler(async (request, response) => {
      const { place_id: placeId } = placeIdParamsSchema.parse(request.params);
      const place = await placeService.get(placeId);
      response.json(toPlaceResponse(place));
    })
  );

  router.post(
    "/",
    asyncHandler(async (request, response) => {
      const input = createPlaceSchema.parse(request.body);
      const place = await placeService.create({
        iotSiteId: input.iot_site_id,
        name: input.name,
        latitude: input.latitude,
        longitude: input.longitude,
        timezone: input.timezone
      });

      response.status(201).json(toPlaceResponse(place));
    })
  );

  router.patch(
    "/:place_id",
    asyncHandler(async (request, response) => {
      const { place_id: placeId } = placeIdParamsSchema.parse(request.params);
      const input = updatePlaceSchema.parse(request.body);
      const place = await placeService.update(placeId, {
        iotSiteId: input.iot_site_id,
        name: input.name,
        latitude: input.latitude,
        longitude: input.longitude,
        timezone: input.timezone
      });

      response.json(toPlaceResponse(place));
    })
  );

  router.delete(
    "/:place_id",
    asyncHandler(async (request, response) => {
      const { place_id: placeId } = placeIdParamsSchema.parse(request.params);
      await placeService.delete(placeId);
      response.status(204).send();
    })
  );

  return router;
};
