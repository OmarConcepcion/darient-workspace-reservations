# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project model

Workspace-reservation system with IoT telemetry. Three deployable units:

- `backend/` — Express + TypeScript REST API at `/api/v1`, MQTT consumer/publisher, SSE notifier.
- `frontend/` — React + Vite SPA (no direct MQTT — consumes the backend SSE stream).
- `external/iot-simulator/` — **black box**. Joined to the cluster only via MQTT (see "iot-simulator boundary").

The project follows **Spec-Driven Development (SDD) with AI**: documentation under `docs/`, `backend/docs/`, `frontend/docs/` is authoritative. Mandatory read order before non-trivial work: `README.md` → `AI.md` → `AGENTS.md` → `docs/requirement.md` → `backend/docs/requirement.md` → `frontend/docs/requirement.md`.

## Architecture

### Backend — Hexagonal / Ports & Adapters

Each module under `backend/src/modules/{places,spaces,reservations,iot}/` follows:

```text
domain/         # business rules, no Express/Prisma
application/    # use cases
ports/          # interfaces (repositories, publishers)
infrastructure/ # Prisma repos, mqtt.js publisher, SSE adapters
presentation/   # Express routers, Zod validation
```

`backend/src/app/dependencies.ts` is the composition root — it wires Prisma repositories, the shared MQTT client, and the in-memory SSE publisher into `createApp()`. `backend/src/server.ts` orchestrates startup/shutdown of the HTTP server and `MqttRuntime` together (SIGINT/SIGTERM aware). Use `createApp(overrides)` from tests to substitute fakes.

### Frontend — Feature-based

```text
frontend/src/{app,shared,features/{spaces,reservations,admin_dashboard,telemetry}}/
```

Server state via TanStack Query; forms via React Hook Form + Zod; HTTP via the centralized Axios client; toasts via Sonner; no business logic in components.

### IoT data flow

```text
iot-simulator → MQTT telemetry/reported → backend (audit.raw_telemetry → aggregate → alerts) → SSE → frontend
frontend → REST → device_desired (persist) → MQTT desired → simulator
```

If the MQTT publish for `desired` fails, the backend persists `device_desired` with `publish_status = FAILED` and responds **502** in the standard error format. Do not silently swallow this.

## Commands

Root (delegates to workspaces):

```bash
npm run setup:env         # copies .env.example → .env in root, backend, frontend
npm run build             # backend build + frontend build
npm test                  # backend vitest + frontend vitest
npm run docker:up         # docker compose up --build
npm run docker:down
npm run prisma:migrate    # prisma migrate dev (in backend)
npm run prisma:seed       # tsx prisma/seed.ts (in backend)
```

Backend (`cd backend`):

```bash
npm run dev               # tsx watch src/server.ts
npm run build             # tsc
npm test                  # unit + route tests (vitest.config.ts)
npm run test:iot:real     # real MQTT+API+DB integration suite (vitest.real.config.ts)
npm run test:watch
npm run prisma:generate | prisma:migrate | prisma:deploy | prisma:seed
```

- Default vitest config includes `src/**/*.test.ts` and **excludes** `src/integration/**`.
- `test:iot:real` requires Postgres + Mosquitto reachable (run `npm run docker:up` first).
- Single test: `npm test -- src/path/to/file.test.ts` or `-t "name pattern"`.

Frontend (`cd frontend`):

```bash
npm run dev               # vite --host 0.0.0.0
npm run build             # tsc -b && vite build
npm test                  # vitest run (jsdom + RTL + MSW)
```

## Environment

Local dev uses `localhost` URLs (`backend/.env.example`); Docker overrides via service hostnames (`darient_postgres`, `darient_mqtt`) in `docker-compose.yml`. Always run `npm run setup:env` before first dev — it only copies if the target is missing, never overwrites.

Auth on every non-`/health`, non-`/docs` route: header `x-api-key: $API_KEY`.

## Database — Prisma multi-schema

`backend/prisma/schema.prisma` declares schemas `core`, `iot`, `audit`. The `DATABASE_URL` query string includes `?schema=core` but Prisma manages all three. After editing `schema.prisma` run `npm run prisma:migrate` (dev) — never edit migration SQL by hand without regenerating.

## Conventions (enforced)

| Area | Convention |
| --- | --- |
| TypeScript code | `camelCase` |
| Classes | `PascalCase` |
| DB schemas / tables / columns | `snake_case` (Prisma `@map`/`@@map`) |
| REST endpoints | `snake_case` (e.g. `/admin/spaces/:space_id/device_desired`) |
| API base path | `/api/v1` |
| Env vars | `UPPER_SNAKE_CASE` |
| Dates over the wire | ISO 8601 UTC |
| Default timezone | `America/Panama` (stored on `places.timezone`, used for office-hours evaluation) |

Domain models are **English**. Do not introduce Spanish identifiers in code.

## Reservation rules (do not silently change)

- Statuses: `ACTIVE`, `CANCELLED`, `EXPIRED`. Expiration is computed dynamically on read for MVP — there is no scheduled job.
- Customers must cancel before deleting. Cancel sets `status = CANCELLED` + `cancelled_at`; hard delete is allowed only for `CANCELLED` reservations.
- Conflict: `new_start < existing_end AND new_end > existing_start AND same_space AND status = ACTIVE`.
- Maximum 3 active reservations per `customer_email` per ISO week.

## iot-simulator boundary

`external/iot-simulator/` is treated as a vendored binary. **Prohibited**: modifying its code, copying its logic into the backend, importing it from the backend, or having the frontend connect to MQTT directly. **Permitted**: reading its README/code to confirm topics and payloads, running it as a Docker service.

Topics:

```text
sites/+/offices/+/telemetry        # backend subscribes
sites/+/offices/+/reported         # backend subscribes
sites/{site_id}/offices/{office_id}/desired   # backend publishes
```

Mapping: `site = place`, `office = space`. Joins are by `places.iot_site_id` and `spaces.iot_office_id`.

SSE events (consumed by frontend at `GET /api/v1/admin/events/stream`): `telemetry_updated`, `alert_updated`, `device_reported_updated`. Payload shapes are in `docs/api_contract.md` and `docs/iot_contract.md` — keep both in sync when changing the contract.

## Phase documentation rules

Files in `docs/phases/`, `backend/docs/phases/`, `frontend/docs/phases/` carry their state in **both filename and content**:

- Suffix: `.COMPLETED.md`, `.PARTIAL.md`, `.PENDING.md`. Rename when state changes.
- Second line of file: `> **STATUS: ✅ COMPLETED**` / `🔄 IN PROGRESS` / `⏳ PENDING`.
- `PARTIAL`: `## Pending` (with `[ ]`) first, then `## Completed` (with `[x]`).
- Maximum 5 general phases — do not invent new ones.

Also keep `docs/status/pending.md` and `docs/status/completed.md` current as work moves.

## Change criteria

A change must respect the approved architecture, keep conventions, never modify the simulator, update the related contract/phase docs, and add or maintain tests when applicable. New libraries require justification — prefer the approved stack already declared in `package.json`.
