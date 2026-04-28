# Darient Workspace Reservations

Sistema full-stack para gestión de reservas de espacios de trabajo con integración IoT mediante MQTT.

El proyecto se trabajará con **Spec-Driven Development (SDD) with AI**: primero se documentan requerimientos, decisiones y contratos; luego se implementa.

## Estado actual

Backend + frontend completos para reservas y monitoreo IoT en tiempo real:

### Backend

- Express/TypeScript en `/api/v1`.
- Health endpoint, Swagger/OpenAPI con cobertura completa de endpoints, API key middleware, Pino logging y error handler estándar.
- Prisma multi-schema con `core`, `iot` y `audit`.
- Seed inicial para `SITE_A`, `OFFICE_1` y `OFFICE_2`.
- CRUD core de places, spaces y reservations.
- Reglas de reservas: conflicto de horario, máximo 3 activas por cliente por semana, cancelación y expiración dinámica.
- Procesamiento backend de tópicos `telemetry` y `reported`.
- Endpoints admin IoT, publicación de `desired` por MQTT, stream SSE y manejo explícito de error `502` si falla el publish.
- Runtime MQTT compartido con startup/shutdown ordenado y logs operativos.
- Suite real de integración backend IoT contra API + MQTT + PostgreSQL.

### Frontend

- Vite/React 19 con React Router, Axios, TanStack Query, Tailwind v4, Sonner y MSW.
- Sistema visual indigo con primitivos compartidos en `src/shared/ui` (Button, Card, Badge, EmptyState, ErrorState, PageHeader, Skeleton, iconos inline).
- Spaces: lista y detalle con loading/empty/error, animaciones con Motion.
- Reservations: lista paginada con cancel, formulario RHF + Zod con selectores cascading place → space y conversión datetime-local → ISO UTC.
- Admin dashboard: monitoring snapshot, stat cards, Recharts live chart, panel desired vs reported, RHF form de control de dispositivo, alerts table.
- SSE consumido vía `fetch` + `ReadableStream` (para enviar `x-api-key`) con reconexión exponencial y refresh inteligente de queries.
- Code splitting por ruta (`React.lazy`) — admin/reservations son chunks independientes.
- 25 tests con Vitest + RTL + MSW cubriendo happy paths, validación de formularios, errores normalizados y parsing SSE.

### Infraestructura

- Docker Compose raíz con backend, frontend, PostgreSQL, MQTT y simulador IoT como caja negra.

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

Eventos SSE públicos:

```txt
telemetry_updated
alert_updated
device_reported_updated
```

Reglas temporales de alertas implementadas:

```txt
CO2: abrir 5 min > threshold, resolver 2 min <= threshold
OCCUPANCY_MAX: abrir 2 min > capacity, resolver 1 min <= capacity
OCCUPANCY_UNEXPECTED: abrir 10 min ocupación inesperada, resolver 5 min en 0 o vuelta a condición válida
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

Si falla la publicación MQTT de `device_desired`, el backend responde `502` con el formato estándar de error.

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
npm install --prefix backend
npm install --prefix frontend
npm run setup:env
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
npm run test:iot:real
```

Raíz:

```bash
npm run build
npm test
npm run docker:up
```

Docker:

```bash
docker compose up --build
```

El backend en Docker usa:

```txt
DATABASE_URL=postgresql://darient:darient@darient_postgres:5432/darient?schema=core
MQTT_URL=mqtt://darient_mqtt:1883
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
