# Frontend Completed Tasks

- [x] Frontend stack selected.
- [x] Frontend architecture selected.
- [x] Routing selected.
- [x] API client selected.
- [x] State management selected.
- [x] UI and animation stack selected.
- [x] Testing strategy selected.

## Foundation

- [x] Vite React app initialized.
- [x] React Router configured with required route shells.
- [x] Axios client configured with `x-api-key`.
- [x] TanStack Query provider configured.
- [x] Tailwind and Sonner configured.
- [x] MSW and React Testing Library configured.
- [x] Frontend foundation tests added.

## Spaces

- [x] Shared `features/places` module (Zod wire schema + `placesApi` + `usePlaces`/`usePlace`).
- [x] `features/spaces` module with Zod schemas, axios API, query hooks and shared keys.
- [x] `SpacesListView` with loading, empty and error states.
- [x] `SpaceDetailView` with breadcrumb, loading and error states.
- [x] Routing wired to feature pages; obsolete `app/pages` shells removed.
- [x] Spaces tests with MSW (list/detail success, empty, error).

## Reservations

- [x] `features/reservations` module with Zod wire + form schemas, axios API, query and mutation hooks.
- [x] `ReservationsListView` with paginated table, status badges, cancel action and Sonner feedback.
- [x] `NewReservationView` form with React Hook Form + Zod resolver, place/space cascading selects, single-day date + hour range inputs, visual availability timeline and ISO UTC submission.
- [x] `ReservationDetailView` with no-edit guidance, full schedule, duration, timeline and status-based actions.
- [x] Reusable `Modal` component for cancel and delete confirmations.
- [x] Cancelled reservations expose delete action; active/expired reservations remain protected.
- [x] Reservation conflict feedback shows backend-provided available windows.
- [x] Reservation form now resets dependent date/hour fields when place or space changes and previews the selected range against daily availability.
- [x] Routes wired to feature views; obsolete reservations page shells removed.
- [x] Reservations tests with MSW (list happy/empty/error, cancel success/failure, form validation and create flow).

## Admin dashboard

- [x] `features/admin_dashboard` module with monitoring, alerts and device-control schemas/api/hooks.
- [x] Custom SSE client built on fetch + ReadableStream so `x-api-key` can be sent; auto-reconnect with backoff.
- [x] `AdminOverviewView` cards linking to per-space monitoring.
- [x] `SpaceMonitoringView` with stat row, Recharts live telemetry chart, device-state panel, RHF+Zod desired-state form and alerts table.
- [x] SSE refreshes alerts/snapshot on `alert_updated` and `device_reported_updated`, appends to chart on `telemetry_updated`.
- [x] Admin tests with MSW (overview list/empty, monitoring snapshot render, desired publish success and 502 backend error).

## Tests & polish (Phase 05)

- [x] Space detail daily availability calendar added with available/reserved windows.
- [x] Help route added with Swagger link and header action beside IoT status.
- [x] SSE parser unit tests covering chunked reassembly, comments and error responses.
- [x] Route-level code splitting via `React.lazy`; initial JS bundle reduced from ~1014 kB to 375 kB.
- [x] Phase docs renamed/badged through Phase 05; root README and AI.md refreshed with frontend deliverables.
