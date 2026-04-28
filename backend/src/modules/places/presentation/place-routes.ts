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

  /**
   * @openapi
   * /places:
   *   get:
   *     tags:
   *       - Places
   *     summary: List places
   *     security:
   *       - ApiKeyAuth: []
   *     responses:
   *       "200":
   *         description: Places retrieved successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/PlaceListResponse"
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   *   post:
   *     tags:
   *       - Places
   *     summary: Create a place
   *     security:
   *       - ApiKeyAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreatePlaceRequest"
   *     responses:
   *       "201":
   *         description: Place created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Place"
   *       "400":
   *         $ref: "#/components/responses/ValidationError"
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   */
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

  /**
   * @openapi
   * /places/{place_id}:
   *   get:
   *     tags:
   *       - Places
   *     summary: Get a place by id
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: place_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       "200":
   *         description: Place retrieved successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Place"
   *       "400":
   *         $ref: "#/components/responses/ValidationError"
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "404":
   *         description: Place not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *             example:
   *               error:
   *                 code: PLACE_NOT_FOUND
   *                 message: Place not found.
   *                 details: {}
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   *   patch:
   *     tags:
   *       - Places
   *     summary: Update a place
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: place_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/UpdatePlaceRequest"
   *     responses:
   *       "200":
   *         description: Place updated successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Place"
   *       "400":
   *         $ref: "#/components/responses/ValidationError"
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "404":
   *         description: Place not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *             example:
   *               error:
   *                 code: PLACE_NOT_FOUND
   *                 message: Place not found.
   *                 details: {}
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   *   delete:
   *     tags:
   *       - Places
   *     summary: Delete a place
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: place_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       "204":
   *         description: Place deleted successfully.
   *       "400":
   *         $ref: "#/components/responses/ValidationError"
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "404":
   *         description: Place not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *             example:
   *               error:
   *                 code: PLACE_NOT_FOUND
   *                 message: Place not found.
   *                 details: {}
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   */
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
