import { Router } from "express";

import { asyncHandler } from "../../../shared/http/async-handler.js";
import type { PlaceRepository } from "../../places/ports/place-repository.js";
import type { SpaceRepository } from "../../spaces/ports/space-repository.js";
import { ReservationService } from "../application/reservation-service.js";
import type { ReservationRepository } from "../ports/reservation-repository.js";
import { toReservationResponse } from "./reservation-mapper.js";
import {
  createReservationSchema,
  listReservationsQuerySchema,
  reservationIdParamsSchema,
  updateReservationSchema
} from "./reservation-schemas.js";

export const createReservationRouter = (
  reservationRepository: ReservationRepository,
  spaceRepository: SpaceRepository,
  placeRepository: PlaceRepository
): Router => {
  const router = Router();
  const reservationService = new ReservationService(
    reservationRepository,
    spaceRepository,
    placeRepository
  );

  /**
   * @openapi
   * /reservations:
   *   get:
   *     tags:
   *       - Reservations
   *     summary: List reservations
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         required: false
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *       - in: query
   *         name: page_size
   *         required: false
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *     responses:
   *       "200":
   *         description: Reservations retrieved successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ReservationListResponse"
   *       "400":
   *         $ref: "#/components/responses/ValidationError"
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   *   post:
   *     tags:
   *       - Reservations
   *     summary: Create a reservation
   *     security:
   *       - ApiKeyAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateReservationRequest"
   *     responses:
   *       "201":
   *         description: Reservation created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Reservation"
   *       "400":
   *         description: Invalid payload or invalid reservation time.
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
   *               invalidTime:
   *                 value:
   *                   error:
   *                     code: INVALID_RESERVATION_TIME
   *                     message: Reservation starts_at must be before ends_at.
   *                     details: {}
   *               placeSpaceMismatch:
   *                 value:
   *                   error:
   *                     code: PLACE_SPACE_MISMATCH
   *                     message: The space does not belong to the selected place.
   *                     details: {}
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "404":
   *         description: Space or place not found.
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
   *       "409":
   *         description: Reservation conflict or weekly limit reached.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *             examples:
   *               conflict:
   *                 value:
   *                   error:
   *                     code: RESERVATION_CONFLICT
   *                     message: The selected space is already reserved for that time range.
   *                     details:
   *                       available_windows:
   *                         - starts_at: "2026-04-28T13:00:00.000Z"
   *                           ends_at: "2026-04-28T14:00:00.000Z"
   *               weeklyLimit:
   *                 value:
   *                   error:
   *                     code: WEEKLY_RESERVATION_LIMIT_EXCEEDED
   *                     message: A customer can have at most 3 active reservations per week.
   *                     details: {}
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   */
  router.get(
    "/",
    asyncHandler(async (request, response) => {
      const query = listReservationsQuerySchema.parse(request.query);
      const result = await reservationService.list({
        page: query.page,
        pageSize: query.page_size
      });

      response.json({
        data: result.data.map(toReservationResponse),
        pagination: {
          page: result.page,
          page_size: result.pageSize,
          total: result.total
        }
      });
    })
  );

  router.get(
    "/:reservation_id",
    asyncHandler(async (request, response) => {
      const { reservation_id: reservationId } = reservationIdParamsSchema.parse(
        request.params
      );
      const reservation = await reservationService.get(reservationId);
      response.json(toReservationResponse(reservation));
    })
  );

  router.post(
    "/",
    asyncHandler(async (request, response) => {
      const input = createReservationSchema.parse(request.body);
      const reservation = await reservationService.create({
        placeId: input.place_id,
        spaceId: input.space_id,
        customerEmail: input.customer_email,
        startsAt: input.starts_at,
        endsAt: input.ends_at
      });

      response.status(201).json(toReservationResponse(reservation));
    })
  );

  /**
   * @openapi
   * /reservations/{reservation_id}:
   *   get:
   *     tags:
   *       - Reservations
   *     summary: Get a reservation by id
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: reservation_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       "200":
   *         description: Reservation retrieved successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Reservation"
   *       "400":
   *         $ref: "#/components/responses/ValidationError"
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "404":
   *         description: Reservation not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *             example:
   *               error:
   *                 code: RESERVATION_NOT_FOUND
   *                 message: Reservation not found.
   *                 details: {}
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   *   patch:
   *     tags:
   *       - Reservations
   *     summary: Update a reservation
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: reservation_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/UpdateReservationRequest"
   *     responses:
   *       "200":
   *         description: Reservation updated successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Reservation"
   *       "400":
   *         description: Invalid payload or invalid reservation time.
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
   *               invalidTime:
   *                 value:
   *                   error:
   *                     code: INVALID_RESERVATION_TIME
   *                     message: Reservation starts_at must be before ends_at.
   *                     details: {}
   *               placeSpaceMismatch:
   *                 value:
   *                   error:
   *                     code: PLACE_SPACE_MISMATCH
   *                     message: The space does not belong to the selected place.
   *                     details: {}
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "404":
   *         description: Reservation, space or place not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *             examples:
   *               reservationNotFound:
   *                 value:
   *                   error:
   *                     code: RESERVATION_NOT_FOUND
   *                     message: Reservation not found.
   *                     details: {}
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
   *       "409":
   *         description: Reservation conflict or weekly limit reached.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *             examples:
   *               conflict:
   *                 value:
   *                   error:
   *                     code: RESERVATION_CONFLICT
   *                     message: The selected space is already reserved for that time range.
   *                     details:
   *                       available_windows:
   *                         - starts_at: "2026-04-28T13:00:00.000Z"
   *                           ends_at: "2026-04-28T14:00:00.000Z"
   *               weeklyLimit:
   *                 value:
   *                   error:
   *                     code: WEEKLY_RESERVATION_LIMIT_EXCEEDED
   *                     message: A customer can have at most 3 active reservations per week.
   *                     details: {}
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   *   delete:
   *     tags:
   *       - Reservations
   *     summary: Delete a cancelled reservation
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: reservation_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       "204":
   *         description: Reservation deleted successfully.
   *       "400":
   *         $ref: "#/components/responses/ValidationError"
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "404":
   *         description: Reservation not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *             example:
   *               error:
   *                 code: RESERVATION_NOT_FOUND
   *                 message: Reservation not found.
   *                 details: {}
   *       "409":
   *         $ref: "#/components/responses/ReservationDeleteConflictError"
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   */
  router.patch(
    "/:reservation_id",
    asyncHandler(async (request, response) => {
      const { reservation_id: reservationId } = reservationIdParamsSchema.parse(
        request.params
      );
      const input = updateReservationSchema.parse(request.body);
      const reservation = await reservationService.update(reservationId, {
        placeId: input.place_id,
        spaceId: input.space_id,
        customerEmail: input.customer_email,
        startsAt: input.starts_at,
        endsAt: input.ends_at
      });

      response.json(toReservationResponse(reservation));
    })
  );

  /**
   * @openapi
   * /reservations/{reservation_id}/cancel:
   *   patch:
   *     tags:
   *       - Reservations
   *     summary: Cancel a reservation
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: reservation_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       "200":
   *         description: Reservation cancelled successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Reservation"
   *       "400":
   *         $ref: "#/components/responses/ValidationError"
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "404":
   *         description: Reservation not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *             example:
   *               error:
   *                 code: RESERVATION_NOT_FOUND
   *                 message: Reservation not found.
   *                 details: {}
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   */
  router.patch(
    "/:reservation_id/cancel",
    asyncHandler(async (request, response) => {
      const { reservation_id: reservationId } = reservationIdParamsSchema.parse(
        request.params
      );
      const reservation = await reservationService.cancel(reservationId);
      response.json(toReservationResponse(reservation));
    })
  );

  router.delete(
    "/:reservation_id",
    asyncHandler(async (request, response) => {
      const { reservation_id: reservationId } = reservationIdParamsSchema.parse(
        request.params
      );
      await reservationService.delete(reservationId);
      response.status(204).send();
    })
  );

  return router;
};
