# Reservations Feature

> **STATUS: ✅ COMPLETED**

## Completed

- [x] `features/reservations` module scaffolded with `api`, `schemas`, `hooks`, `components` and `pages`.
- [x] Reservation Zod wire schema (transforms snake_case → camelCase) and form schema with single-day `reservation_date` + `start_time`/`end_time` refinement.
- [x] `reservationsApi` (list / get / create / cancel) over the shared Axios client.
- [x] Query and mutation hooks: `useReservations` (paginated), `useReservation`, `useCreateReservation`, `useCancelReservation`, with shared query keys and list invalidation on success.
- [x] `ReservationsListView` with table, status badges, cancel action, pagination, loading skeleton, empty and error states; cancel feedback via Sonner toasts.
- [x] `NewReservationView` form (React Hook Form + Zod resolver) with place/space selectors filtered by chosen place, one reservation date plus hourly start/end inputs converted to ISO UTC, inline error messages, submit button busy state, success toast, navigate-back behaviour, and error toast surfacing normalized backend messages.
- [x] Reservation create flow includes a visual daily timeline with selected range, available windows and reserved windows for the chosen date, while keeping backend conflict validation unchanged.
- [x] Routes wired to feature views; obsolete `app/pages/Reservations*` shells removed.
- [x] Tests (MSW) cover list happy/empty/error, cancel success/failure, form validation (empty fields and `ends_at` ≤ `starts_at`), successful create flow with navigation, and backend-error toasting.

## Done when

The UI flow works locally and is documented.
