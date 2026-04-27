import { Router } from "express";

import { asyncHandler } from "../../../shared/http/async-handler.js";
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
  spaceRepository: SpaceRepository
): Router => {
  const router = Router();
  const reservationService = new ReservationService(
    reservationRepository,
    spaceRepository
  );

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

  return router;
};
