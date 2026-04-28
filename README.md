# Darient Workspace Reservations

Sistema full-stack para gestionar reservas de espacios de trabajo y monitoreo IoT en tiempo real mediante MQTT + SSE.

El proyecto incluye un backend en Node.js/Express, un frontend en React/Vite, persistencia en PostgreSQL, integración con un simulador IoT mediante MQTT y un dashboard administrativo con actualizaciones en tiempo real.

---

## Estado actual

- Backend Express/TypeScript expuesto bajo `/api/v1`.
- Swagger disponible en `/api/v1/docs`.
- Frontend React/Vite con flujos de espacios, reservas, ayuda y dashboard administrativo IoT.
- Creación de reservas protegida contra concurrencia mediante transacción Prisma serializable, revalidación interna y retry único.
- Reglas activas de reservas:
  - No se permiten solapamientos `ACTIVE` por `space_id`.
  - Máximo 3 reservas activas por `customer_email` por semana.
  - La reserva debe cancelarse antes de eliminarse.
- Suites de pruebas verificadas al momento de esta documentación:
  - Backend: 32 tests.
  - Frontend: 39 tests.
- El simulador IoT, ubicado en `external/iot-simulator/`, se mantiene como una caja negra, sin modificar su lógica.

---

## Inicio rápido

Para levantar todo el ambiente local con Docker:

```bash
npm install --prefix backend
npm install --prefix frontend
npm run setup:env
npm run docker:up
```

Luego abrir:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:3000/api/v1/health`
- Swagger: `http://localhost:3000/api/v1/docs`

Para ejecutar validaciones desde la raíz:

```bash
npm run build
npm run test
npm run typecheck
```

Para apagar los servicios:

```bash
npm run docker:down
```

---

## Proceso de desarrollo

El proyecto fue desarrollado siguiendo un enfoque estructurado para mantener claridad técnica, separación de responsabilidades y validación continua.

Se utilizaron principalmente dos metodologías:

- **Spec-Driven Development**: antes de iniciar la implementación principal, se analizaron los requerimientos de backend, frontend e IoT para definir arquitectura, contratos de API, modelo de datos, estructura del proyecto, fases de implementación y criterios de validación.
- **Test-Driven Development**: durante el desarrollo se trabajó definiendo comportamientos esperados mediante pruebas, ejecutando la suite para validar fallos iniciales, implementando la funcionalidad y volviendo a ejecutar las pruebas hasta obtener resultados correctos.

La AI fue utilizada como herramienta de apoyo para análisis, documentación, revisión e implementación asistida. Las decisiones técnicas, arquitectura, validación y responsabilidad final del proyecto permanecieron bajo responsabilidad del desarrollador.

El detalle del uso responsable de AI/IA se encuentra documentado en [AI.md](./AI.md).

---

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
- Vitest
- Supertest

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Axios
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS v4
- Motion
- Sonner
- Recharts
- Vitest
- React Testing Library
- MSW

### Infraestructura

- Docker Compose
- PostgreSQL 16
- Eclipse Mosquitto
- Simulador IoT ubicado en `external/iot-simulator/`, tratado como black box

---

## Estructura general del proyecto

```txt
.
├── .claude/
├── backend/
│   ├── prisma/
│   ├── src/
│   └── docs/
├── docker/
├── docs/
├── external/
│   └── iot-simulator/
│       ├── .env.example
│       ├── docker-compose.yml
│       ├── index.js
│       ├── mosquitto.conf
│       ├── package.json
│       ├── README.md
│       └── send-desired.js
├── frontend/
│   ├── src/
│   └── docs/
├── scripts/
├── .gitignore
├── AGENTS.md
├── AI.md
├── CLAUDE.md
├── docker-compose.yml
├── package.json
└── README.md
```

El backend separa responsabilidades siguiendo un estilo inspirado en Hexagonal Architecture / Ports and Adapters.

El frontend está organizado por features para mantener separados los flujos principales de espacios, reservas, ayuda y dashboard administrativo.

El simulador IoT se encuentra dentro de `external/iot-simulator/` y se trata como una dependencia externa del proyecto. Su lógica no fue modificada; únicamente se integra mediante MQTT desde el backend.

---

## Requisitos previos

- Node.js 22+
- npm 10+
- Docker
- Docker Compose

---

## Variables de entorno

El workspace usa variables por aplicación. No existe `.env` en la raíz del proyecto.

### Backend

Archivo base:

```txt
backend/.env.example
```

Variables principales:

- `API_KEY`
- `DATABASE_URL`
- `MQTT_URL`
- `CORS_ORIGIN`

### Frontend

Archivo base:

```txt
frontend/.env.example
```

Variables principales:

- `VITE_API_URL`
- `VITE_API_KEY`

### Inicializar `.env`

Desde la raíz del proyecto:

```bash
npm install --prefix backend
npm install --prefix frontend
npm run setup:env
```

Este comando genera los archivos `.env` necesarios para backend y frontend tomando como base los archivos `.env.example`.

---

## Levantar con Docker Compose

Desde la raíz del proyecto:

```bash
npm run docker:up
```

Servicios principales:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- PostgreSQL: `localhost:5432`
- MQTT: `localhost:1883`
- IoT simulator: servicio ubicado en `external/iot-simulator/`

El backend dentro del contenedor ejecuta automáticamente:

- `prisma generate`
- `prisma migrate deploy`
- `prisma seed`

Para apagar los servicios:

```bash
npm run docker:down
```

---

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

El backend queda disponible en:

```txt
http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run setup:env
npm run dev
```

El frontend queda disponible en:

```txt
http://localhost:5173
```

---

## Migraciones y seed

Desde la raíz del proyecto:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Estos scripts preparan Prisma, aplican migraciones y cargan datos iniciales de demostración.

---

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

---

## API key

Todas las rutas protegidas requieren el siguiente header:

```http
x-api-key: <API_KEY>
```

En Docker local, el valor por defecto es:

```txt
darient_dev_key
```

Ejemplo:

```bash
curl http://localhost:3000/api/v1/places \
  -H "x-api-key: darient_dev_key"
```

---

## Swagger y health check

- Swagger UI: `http://localhost:3000/api/v1/docs`
- Health check: `http://localhost:3000/api/v1/health`

Swagger documenta los endpoints principales del backend, incluyendo places, spaces, reservations, health y endpoints administrativos relacionados con IoT.

---

## Endpoints principales

### Places

```http
GET    /api/v1/places
GET    /api/v1/places/:place_id
POST   /api/v1/places
PATCH  /api/v1/places/:place_id
DELETE /api/v1/places/:place_id
```

### Spaces

```http
GET    /api/v1/spaces
GET    /api/v1/spaces/:space_id
GET    /api/v1/spaces/:space_id/availability?date=YYYY-MM-DD
POST   /api/v1/spaces
PATCH  /api/v1/spaces/:space_id
DELETE /api/v1/spaces/:space_id
```

### Reservations

```http
GET    /api/v1/reservations?page=1&page_size=10
GET    /api/v1/reservations/:reservation_id
POST   /api/v1/reservations
PATCH  /api/v1/reservations/:reservation_id
PATCH  /api/v1/reservations/:reservation_id/cancel
DELETE /api/v1/reservations/:reservation_id
```

### Admin IoT

```http
GET    /api/v1/admin/spaces/:space_id/monitoring
GET    /api/v1/admin/spaces/:space_id/alerts
PATCH  /api/v1/admin/spaces/:space_id/device_desired
GET    /api/v1/admin/events/stream
```

---

## Cómo probar el flujo principal de reservas

1. Crear un `place`.
2. Crear un `space` asociado al `place`.
3. Consultar disponibilidad diaria en `/spaces/:space_id/availability`.
4. Crear una reserva con `POST /reservations`.
5. Intentar crear otra reserva superpuesta para verificar `409 RESERVATION_CONFLICT`.
6. Cancelar la reserva con `/reservations/:reservation_id/cancel`.
7. Eliminar la reserva con `DELETE /reservations/:reservation_id`.

---

## Reglas principales de reservas

El sistema valida las siguientes reglas:

- No pueden existir reservas activas superpuestas para el mismo espacio.
- Un cliente no puede tener más de 3 reservas activas por semana.
- Las reservas se crean con rango de fecha/hora en formato ISO.
- La disponibilidad se puede consultar por espacio y fecha.
- La eliminación de una reserva requiere cancelación previa.
- Las reservas canceladas no bloquean disponibilidad futura.

---

## Blindaje de concurrencia en reservas

La creación de reservas se ejecuta dentro de una transacción Prisma con aislamiento serializable.

Dentro de la misma transacción se revalidan:

- Conflicto de horario.
- Límite semanal por cliente.
- Creación efectiva de la reserva.

Si PostgreSQL/Prisma reporta un conflicto serializable, el backend reintenta la operación una vez.

Si otra petición ya ganó la carrera y creó una reserva para el mismo horario, la API responde `409` usando el formato de error existente.

---

## Formato de errores

La API utiliza un formato consistente de error:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

Ejemplo de conflicto de reserva:

```json
{
  "error": {
    "code": "RESERVATION_CONFLICT",
    "message": "The selected space is already reserved for the requested time range.",
    "details": {}
  }
}
```

---

## IoT, MQTT y SSE

El proyecto incluye integración IoT como parte del bonus.

El simulador ubicado en `external/iot-simulator/` publica información empírica relacionada con espacios físicos, incluyendo ocupación, CO2, humedad, temperatura y batería.

El backend consume esta información desde MQTT, la procesa y expone datos para el dashboard administrativo.

### Mapeo de conceptos

En el simulador IoT:

- `site` corresponde a `place`.
- `office` corresponde a `space`.

### Tópicos MQTT

```txt
sites/+/offices/+/telemetry
sites/+/offices/+/reported
sites/{site_id}/offices/{office_id}/desired
```

### Eventos SSE

```txt
telemetry_updated
alert_updated
device_reported_updated
```

### Flujo esperado

1. El simulador publica eventos `telemetry` y `reported`.
2. El backend consume los mensajes desde MQTT.
3. El backend persiste y agrega datos relevantes.
4. El backend emite eventos SSE.
5. El frontend administrativo consume SSE usando `fetch` + `ReadableStream`.
6. El dashboard se actualiza en tiempo real.
7. El administrador puede publicar `device_desired` mediante REST.
8. Si falla el publish MQTT de `device_desired`, la API responde `502`.

---

## Pruebas

El proyecto incluye pruebas automatizadas para backend y frontend.

### Backend

Incluye pruebas con Vitest y Supertest para validar comportamiento de API, reglas de negocio, manejo de errores e integración IoT.

```bash
cd backend
npm run test
```

Para ejecutar pruebas reales relacionadas con IoT:

```bash
cd backend
npm run test:iot:real
```

### Frontend

Incluye pruebas con Vitest, React Testing Library y MSW para validar comportamiento de componentes, integración con API simulada y flujos principales.

```bash
cd frontend
npm run test
```

### Typecheck

```bash
npm run typecheck
```

---

## Documentación relacionada

- [AI.md](./AI.md)
- [AGENTS.md](./AGENTS.md)
- [CLAUDE.md](./CLAUDE.md)
- [docs/api_contract.md](./docs/api_contract.md)
- [docs/iot_contract.md](./docs/iot_contract.md)

---

## Uso de AI/IA

El uso de AI está documentado en [AI.md](./AI.md).

En resumen:

- La AI fue utilizada como herramienta de apoyo para análisis, documentación, revisión e implementación asistida.
- Las decisiones técnicas fueron tomadas por el desarrollador.
- La arquitectura, validación, pruebas y responsabilidad final permanecieron bajo responsabilidad del desarrollador.
- El desarrollo siguió un enfoque basado en Spec-Driven Development y Test-Driven Development.

---

## Limitaciones conocidas

- No se incluyó configuración de `lint` en esta entrega. Se priorizaron `build`, `test` y `typecheck` para mantener el alcance alineado con el tiempo disponible de la prueba.
- El build del frontend puede mostrar un warning de tamaño de chunk relacionado con el dashboard administrativo. La ruta ya se encuentra separada mediante carga diferida.
- Algunas pruebas del dashboard pueden mostrar warnings de tamaño de contenedor de Recharts en JSDOM. Estos warnings no afectan el resultado de la suite de pruebas.

---

## Notas finales

Este proyecto fue desarrollado buscando cumplir los requerimientos funcionales y técnicos solicitados, manteniendo una arquitectura clara, separación de responsabilidades, documentación suficiente, pruebas automatizadas y soporte para el bonus IoT.

La solución está preparada para ejecutarse localmente mediante Docker Compose y para ser revisada mediante Swagger, pruebas automatizadas y documentación incluida en el repositorio.