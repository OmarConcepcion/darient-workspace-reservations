# Frontend Requirement

## Stack

React + TypeScript + Vite + React Router + Axios + TanStack Query + React Hook Form + Zod + Tailwind + Motion + Sonner + Recharts + Vitest + React Testing Library + MSW.

## Architecture

Feature-Based Architecture.

```txt
frontend/src/
  app/
  shared/
  features/
    spaces/
    reservations/
    admin_dashboard/
    telemetry/
```

Each feature may include:

```txt
api/
components/
hooks/
pages/
schemas/
types/
```

## Routes

```txt
/
/spaces
/spaces/:space_id
/reservations
/reservations/new
/reservations/:reservation_id
/admin
/admin/spaces/:space_id
/help
```

## API

- Axios centralized client.
- Base URL from `VITE_API_URL`.
- API key from `VITE_API_KEY`.
- Send `x-api-key` in requests.
- Normalize backend errors.

## UX

- Modern but not overloaded.
- Responsive.
- Smooth animations.
- Sonner toasts for actions.
- Inline errors for forms.
- Loading and empty states.
- Reusable modal for destructive confirmations.
- Reservation rows navigate to detail.
- Reservation detail explains that reservations cannot be edited; users must cancel and recreate if something is wrong.
- Cancel action requires confirmation.
- Delete action appears only for `CANCELLED` reservations and requires confirmation.
- Reservation date ranges display full start and end date/time.
- Reservation creation uses one reservation date plus start/end hour inputs, then builds the backend `starts_at` / `ends_at` timestamps from that single day.
- Reservation creation shows a visual daily timeline with selected range, available windows and reserved windows as reference.
- Reservation conflicts show available windows returned by the backend.
- Space detail shows daily available and reserved windows for the selected date.
- Header help action opens `/help`, which links to Swagger at `${VITE_API_URL}/docs`.

## Admin dashboard

- Cards.
- Alert table.
- Desired/reported state.
- Recharts simple telemetry chart.
- SSE events: `telemetry_updated`, `alert_updated`, `device_reported_updated`.

## Tests

- Render pages.
- Reservation form validation.
- API error display.
- Dashboard basic render.
