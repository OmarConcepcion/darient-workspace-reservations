import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  reservationsApi,
  type CreateReservationInput,
  type ListReservationsParams
} from "../api/reservations-api";

export const reservationsQueryKeys = {
  all: ["reservations"] as const,
  lists: () => [...reservationsQueryKeys.all, "list"] as const,
  list: (params: Required<ListReservationsParams>) =>
    [...reservationsQueryKeys.lists(), params] as const,
  detail: (reservationId: string) =>
    [...reservationsQueryKeys.all, "detail", reservationId] as const
};

export const useReservations = (params: ListReservationsParams = {}) => {
  const normalized: Required<ListReservationsParams> = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10
  };

  return useQuery({
    queryKey: reservationsQueryKeys.list(normalized),
    queryFn: () => reservationsApi.list(normalized)
  });
};

export const useReservation = (reservationId: string | undefined) =>
  useQuery({
    queryKey: reservationsQueryKeys.detail(reservationId ?? ""),
    queryFn: () => reservationsApi.get(reservationId as string),
    enabled: typeof reservationId === "string" && reservationId.length > 0
  });

export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReservationInput) => reservationsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: reservationsQueryKeys.lists()
      });
    }
  });
};

export const useCancelReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reservationId: string) => reservationsApi.cancel(reservationId),
    onSuccess: (reservation) => {
      void queryClient.invalidateQueries({
        queryKey: reservationsQueryKeys.lists()
      });
      void queryClient.invalidateQueries({
        queryKey: reservationsQueryKeys.detail(reservation.id)
      });
    }
  });
};
