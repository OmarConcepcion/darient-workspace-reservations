import { apiClient } from "../../../shared/api/client";
import {
  reservationListResponseSchema,
  reservationSchema,
  type Reservation,
  type ReservationListResponse
} from "../schemas/reservation";

export type ListReservationsParams = {
  page?: number;
  pageSize?: number;
};

export type CreateReservationInput = {
  placeId: string;
  spaceId: string;
  customerEmail: string;
  startsAt: string;
  endsAt: string;
};

export const reservationsApi = {
  list: async (
    params: ListReservationsParams = {}
  ): Promise<ReservationListResponse> => {
    const { data } = await apiClient.get("/reservations", {
      params: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 10
      }
    });
    return reservationListResponseSchema.parse(data);
  },
  get: async (reservationId: string): Promise<Reservation> => {
    const { data } = await apiClient.get(`/reservations/${reservationId}`);
    return reservationSchema.parse(data);
  },
  create: async (input: CreateReservationInput): Promise<Reservation> => {
    const { data } = await apiClient.post("/reservations", {
      place_id: input.placeId,
      space_id: input.spaceId,
      customer_email: input.customerEmail,
      starts_at: input.startsAt,
      ends_at: input.endsAt
    });
    return reservationSchema.parse(data);
  },
  cancel: async (reservationId: string): Promise<Reservation> => {
    const { data } = await apiClient.patch(
      `/reservations/${reservationId}/cancel`
    );
    return reservationSchema.parse(data);
  }
};
