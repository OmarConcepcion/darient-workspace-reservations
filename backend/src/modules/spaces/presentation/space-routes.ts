import { Router } from "express";

import { asyncHandler } from "../../../shared/http/async-handler.js";
import type { PlaceRepository } from "../../places/ports/place-repository.js";
import { ReservationService } from "../../reservations/application/reservation-service.js";
import { toAvailabilityResponse } from "../../reservations/presentation/reservation-mapper.js";
import { availabilityDateQuerySchema } from "../../reservations/presentation/reservation-schemas.js";
import type { ReservationRepository } from "../../reservations/ports/reservation-repository.js";
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
  placeRepository: PlaceRepository,
  reservationRepository: ReservationRepository
): Router => {
  const router = Router();
  const spaceService = new SpaceService(spaceRepository, placeRepository);
  const reservationService = new ReservationService(
    reservationRepository,
    spaceRepository,
    placeRepository
  );

  /**
   * @openapi
   * /spaces:
   *   get:
   *     tags:
   *       - Spaces
   *     summary: List spaces
   *     security:
   *       - ApiKeyAuth: []
   *     responses:
   *       "200":
   *         description: Spaces retrieved successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/SpaceListResponse"
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   *   post:
   *     tags:
   *       - Spaces
   *     summary: Create a space
   *     security:
   *       - ApiKeyAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateSpaceRequest"
   *     responses:
   *       "201":
   *         description: Space created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Space"
   *       "400":
   *         $ref: "#/components/responses/ValidationError"
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "404":
   *         description: Selected place was not found.
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
  router.get(
    "/",
    asyncHandler(async (_request, response) => {
      const spaces = await spaceService.list();
      response.json({ data: spaces.map(toSpaceResponse) });
    })
  );

  /**
   * @openapi
   * /spaces/{space_id}/availability:
   *   get:
   *     tags:
   *       - Spaces
   *     summary: Get daily availability for a space
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: space_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: date
   *         required: true
   *         description: Local day for the space in YYYY-MM-DD format.
   *         schema:
   *           type: string
   *           pattern: "^\\d{4}-\\d{2}-\\d{2}$"
   *           example: "2026-04-27"
   *     responses:
   *       "200":
   *         description: Daily availability calculated successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/AvailabilityResponse"
   *       "400":
   *         description: Invalid UUID or invalid availability date.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *             examples:
   *               validation:
   *                 value:
   *                   error:
   *                     code: VALIDATION_ERROR
   *                     message: Invalid request payload.
   *                     details:
   *                       issues: []
   *               invalidDate:
   *                 value:
   *                   error:
   *                     code: INVALID_AVAILABILITY_DATE
   *                     message: Availability date must use YYYY-MM-DD format.
   *                     details: {}
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "404":
   *         description: Space or related place was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *             examples:
   *               spaceNotFound:
   *                 value:
   *                   error:
   *                     code: SPACE_NOT_FOUND
   *                     message: Space not found.
   *                     details: {}
   *               placeNotFound:
   *                 value:
   *                   error:
   *                     code: PLACE_NOT_FOUND
   *                     message: Place not found.
   *                     details: {}
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   */
  router.get(
    "/:space_id/availability",
    asyncHandler(async (request, response) => {
      const { space_id: spaceId } = spaceIdParamsSchema.parse(request.params);
      const { date } = availabilityDateQuerySchema.parse(request.query);
      const availability = await reservationService.getAvailability(spaceId, date);
      response.json(toAvailabilityResponse(availability));
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

  /**
   * @openapi
   * /spaces/{space_id}:
   *   get:
   *     tags:
   *       - Spaces
   *     summary: Get a space by id
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: space_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       "200":
   *         description: Space retrieved successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Space"
   *       "400":
   *         $ref: "#/components/responses/ValidationError"
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "404":
   *         description: Space not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *             example:
   *               error:
   *                 code: SPACE_NOT_FOUND
   *                 message: Space not found.
   *                 details: {}
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   *   patch:
   *     tags:
   *       - Spaces
   *     summary: Update a space
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: space_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/UpdateSpaceRequest"
   *     responses:
   *       "200":
   *         description: Space updated successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Space"
   *       "400":
   *         $ref: "#/components/responses/ValidationError"
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "404":
   *         description: Space or selected place was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *             examples:
   *               spaceNotFound:
   *                 value:
   *                   error:
   *                     code: SPACE_NOT_FOUND
   *                     message: Space not found.
   *                     details: {}
   *               placeNotFound:
   *                 value:
   *                   error:
   *                     code: PLACE_NOT_FOUND
   *                     message: Place not found.
   *                     details: {}
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   *   delete:
   *     tags:
   *       - Spaces
   *     summary: Delete a space
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: space_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       "204":
   *         description: Space deleted successfully.
   *       "400":
   *         $ref: "#/components/responses/ValidationError"
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "404":
   *         description: Space not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *             example:
   *               error:
   *                 code: SPACE_NOT_FOUND
   *                 message: Space not found.
   *                 details: {}
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   */
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
