# Darient Workspace Reservations

Sistema full-stack para gestión de reservas de espacios de trabajo con integración IoT mediante MQTT.

El proyecto se trabajará con **Spec-Driven Development (SDD) with AI**: primero se documentan requerimientos, decisiones y contratos; luego se implementa.

## Stack aprobado

### Backend
- Node.js + Express + TypeScript
- Hexagonal Architecture / Ports & Adapters
- PostgreSQL + Prisma
- Zod para validación
- mqtt.js para MQTT
- SSE para tiempo real
- Pino para logs
- Swagger/OpenAPI con `swagger-jsdoc` + `swagger-ui-express`
- Vitest + Supertest

### Frontend
- React + TypeScript + Vite
- Feature-Based Architecture
- React Router
- Axios centralizado
- TanStack Query
- React Hook Form + Zod
- Tailwind CSS
- Motion for React
- Sonner
- Recharts
- Vitest + React Testing Library + MSW

### Infraestructura
- Docker Compose raíz
- PostgreSQL
- Mosquitto MQTT
- `iot-simulator` como black box dentro del mismo cluster Docker

## Convenciones

| Área | Decisión |
|---|---|
| Código TypeScript | `camelCase` |
| Modelos/dominio | Inglés |
| Tablas DB | `snake_case` |
| Columnas DB | `snake_case` |
| Endpoints REST | `snake_case` |
| API base path | `/api/v1` |
| API Key header | `x-api-key` |
| Fechas API | ISO 8601 UTC |
| Timezone default | `America/Panama` |

## Arquitectura

Backend:

```txt
REST / MQTT / SSE adapters
        ↓
Application use cases
        ↓
Domain rules
        ↓
Ports
        ↓
Infrastructure adapters: Prisma, MQTT, SSE, Logger
```

Frontend:

```txt
src/
  app/
  shared/
  features/
    spaces/
    reservations/
    admin_dashboard/
    telemetry/
```

## Base de datos

PostgreSQL schemas:

```txt
core   -> places, spaces, reservations, office_hours
iot    -> telemetry_aggregations, device_desired, device_reported, alerts
audit  -> raw_telemetry
```

## IoT

El `iot-simulator` no se modifica. Se ejecuta como contenedor dentro del mismo `docker-compose`, pero se integra únicamente por MQTT.

Mapeo:

```txt
site   = place
office = space
```

Tópicos:

```txt
sites/+/offices/+/telemetry
sites/+/offices/+/reported
sites/{site_id}/offices/{office_id}/desired
```

## Docker esperado

Servicios:

```txt
darient_backend
darient_frontend
darient_postgres
darient_mqtt
darient_iot_simulator
```

Red:

```txt
darient_network
```

Puertos:

```txt
backend: 3000
frontend: 5173
postgres: 5432
mqtt: 1883
```

## Endpoints principales

```http
GET /api/v1/health
GET /api/v1/docs
```

```http
GET    /api/v1/places
GET    /api/v1/places/:place_id
POST   /api/v1/places
PATCH  /api/v1/places/:place_id
DELETE /api/v1/places/:place_id
```

```http
GET    /api/v1/spaces
GET    /api/v1/spaces/:space_id
POST   /api/v1/spaces
PATCH  /api/v1/spaces/:space_id
DELETE /api/v1/spaces/:space_id
```

```http
GET   /api/v1/reservations?page=1&page_size=10
GET   /api/v1/reservations/:reservation_id
POST  /api/v1/reservations
PATCH /api/v1/reservations/:reservation_id
PATCH /api/v1/reservations/:reservation_id/cancel
```

```http
GET   /api/v1/admin/spaces/:space_id/monitoring
GET   /api/v1/admin/spaces/:space_id/alerts
PATCH /api/v1/admin/spaces/:space_id/device_desired
GET   /api/v1/admin/events/stream
```

## Reglas de reservas

- El cliente no elimina reservas desde la interfaz; solo cancela.
- Cancelar cambia `status = CANCELLED`.
- Estados: `ACTIVE`, `CANCELLED`, `EXPIRED`.
- Expiración se calcula dinámicamente al listar/detallar para MVP.
- No puede existir solapamiento para el mismo espacio.
- Máximo 3 reservas activas por cliente por semana.

Regla de conflicto:

```txt
new_start < existing_end
AND new_end > existing_start
AND same_space
AND status = ACTIVE
```

## Comandos sugeridos

```bash
docker compose up --build
```

Backend:

```bash
cd backend
npm install
npm run setup:env
npm run prisma:migrate
npm run prisma:seed
npm run dev
npm test
```

Frontend:

```bash
cd frontend
npm install
npm run setup:env
npm run dev
npm test
```

## Documentación

Versionados:

```txt
README.md
AI.md
AGENTS.md
```

Locales por ahora y en `.gitignore`:

```txt
docs/
backend/docs/
frontend/docs/
```
