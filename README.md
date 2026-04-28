# Darient Workspace Reservations

Sistema full-stack para gestionar reservas de espacios de trabajo y monitoreo IoT en tiempo real sobre MQTT + SSE.

## Estado actual

- Backend Express/TypeScript expuesto en `/api/v1` con Swagger en `/api/v1/docs`.
- Frontend React/Vite con flujos de spaces, reservations, help y dashboard administrativo IoT.
- Creación de reservas endurecida contra concurrencia con transacción Prisma serializable, revalidación interna y retry único.
- Reglas activas de reservas:
  - sin solapamientos `ACTIVE` por `space_id`
  - máximo 3 reservas activas por `customer_email` por semana
  - cancelación obligatoria antes de eliminar
- Backend verificado con 32 tests; frontend verificado con 39 tests.

## Stack

### Backend

- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma
- Zod
- mqtt.js
- SSE
- Pino
- Swagger/OpenAPI
- Vitest + Supertest

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Axios
- TanStack Query
- React Hook Form + Zod
- Tailwind CSS v4
- Motion
- Sonner
- Recharts
- Vitest + React Testing Library + MSW

### Infra

- Docker Compose
- PostgreSQL 16
- Eclipse Mosquitto
- `iot-simulator` como black box

## Requisitos previos

- Node.js 22+
- npm 10+
- Docker y Docker Compose

## Variables de entorno

El workspace usa variables por app; no existe `.env` en la raíz.

### Backend

Archivo base: [backend/.env.example](/Users/omarconcepcion/Documents/Side Project/Mini-Project/darient-workspace-reservations/backend/.env.example)

Variables principales:

- `API_KEY`
- `DATABASE_URL`
- `MQTT_URL`
- `CORS_ORIGIN`

### Frontend

Archivo base: [frontend/.env.example](/Users/omarconcepcion/Documents/Side Project/Mini-Project/darient-workspace-reservations/frontend/.env.example)

Variables principales:

- `VITE_API_URL`
- `VITE_API_KEY`

### Inicializar `.env`

```bash
npm install --prefix backend
npm install --prefix frontend
npm run setup:env
```

## Levantar con Docker Compose

```bash
npm run docker:up
```

Servicios:

- backend: `http://localhost:3000`
- frontend: `http://localhost:5173`
- postgres: `localhost:5432`
- mqtt: `localhost:1883`

El backend del contenedor ejecuta automáticamente:

- `prisma generate`
- `prisma migrate deploy`
- `prisma seed`

Para apagar:

```bash
npm run docker:down
```

## Levantar manualmente

### Backend

```bash
cd backend
npm install
npm run setup:env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run setup:env
npm run dev
```

## Migraciones y seed

Desde la raíz:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Scripts de validación

### Raíz

```bash
npm run build
npm run test
npm run typecheck
```

### Backend

```bash
cd backend
npm run build
npm run test
npm run typecheck
npm run test:iot:real
```

### Frontend

```bash
cd frontend
npm run build
npm run test
npm run typecheck
```

No existe `lint` en esta entrega porque el repositorio todavía no tiene configuración ESLint y agregar tooling nuevo aquí metería complejidad innecesaria.

## API key

Todas las rutas protegidas requieren:

```http
x-api-key: <API_KEY>
```

En Docker local el valor por defecto es:

```txt
darient_dev_key
```

## Swagger y endpoints

- Swagger UI: [http://localhost:3000/api/v1/docs](http://localhost:3000/api/v1/docs)
- Health: [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health)

Endpoints principales:

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
GET    /api/v1/spaces/:space_id/availability?date=YYYY-MM-DD
POST   /api/v1/spaces
PATCH  /api/v1/spaces/:space_id
DELETE /api/v1/spaces/:space_id
```

```http
GET    /api/v1/reservations?page=1&page_size=10
GET    /api/v1/reservations/:reservation_id
POST   /api/v1/reservations
PATCH  /api/v1/reservations/:reservation_id
PATCH  /api/v1/reservations/:reservation_id/cancel
DELETE /api/v1/reservations/:reservation_id
```

```http
GET    /api/v1/admin/spaces/:space_id/monitoring
GET    /api/v1/admin/spaces/:space_id/alerts
PATCH  /api/v1/admin/spaces/:space_id/device_desired
GET    /api/v1/admin/events/stream
```

## Cómo probar el flujo principal de reservas

1. Crear un `place`.
2. Crear un `space` asociado.
3. Consultar disponibilidad diaria en `/spaces/:space_id/availability`.
4. Crear una reserva con `POST /reservations`.
5. Intentar crear otra superpuesta para verificar `409 RESERVATION_CONFLICT`.
6. Cancelar con `/reservations/:reservation_id/cancel`.
7. Eliminar con `DELETE /reservations/:reservation_id`.

## Cómo funciona el blindaje de concurrencia

La creación de reservas se ejecuta dentro de una transacción Prisma con aislamiento serializable.

Dentro de la misma transacción se revalidan:

- conflicto de horario
- límite semanal
- creación efectiva de la reserva

Si PostgreSQL/Prisma reporta conflicto serializable, el backend reintenta una vez. Si otra request ya ganó la carrera, la API responde `409` con el formato de error existente.

## IoT, MQTT y SSE

Tópicos MQTT:

```txt
sites/+/offices/+/telemetry
sites/+/offices/+/reported
sites/{site_id}/offices/{office_id}/desired
```

Eventos SSE:

```txt
telemetry_updated
alert_updated
device_reported_updated
```

Flujo esperado:

1. El simulador publica `telemetry` y `reported`.
2. El backend persiste/agrega datos y emite SSE.
3. El frontend administrativo consume SSE con `fetch` + `ReadableStream`.
4. El administrador puede publicar `device_desired` por REST; si falla el publish MQTT, la API responde `502`.

## Documentación relacionada

- [AI.md](/Users/omarconcepcion/Documents/Side Project/Mini-Project/darient-workspace-reservations/AI.md)
- [AGENTS.md](/Users/omarconcepcion/Documents/Side Project/Mini-Project/darient-workspace-reservations/AGENTS.md)
- [docs/api_contract.md](/Users/omarconcepcion/Documents/Side Project/Mini-Project/darient-workspace-reservations/docs/api_contract.md)
- [docs/iot_contract.md](/Users/omarconcepcion/Documents/Side Project/Mini-Project/darient-workspace-reservations/docs/iot_contract.md)

## Limitaciones conocidas

- No hay script `lint` todavía; falta introducir y acordar configuración ESLint.
- El build del frontend sigue emitiendo un warning de chunk grande para una porción lazy del dashboard.
- Los tests del dashboard muestran warnings de tamaño de contenedor de Recharts en JSDOM, pero no fallan la suite.
