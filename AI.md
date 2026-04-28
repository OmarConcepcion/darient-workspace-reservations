# AI.md

Documento de uso de inteligencia artificial en el proyecto.

## Enfoque

Este proyecto usa **Spec-Driven Development (SDD) with AI**. La AI fue utilizada para apoyar el análisis, planificación y documentación antes de implementar.

## Uso de AI hasta ahora

La AI ayudó a:

- Analizar requerimientos frontend y backend.
- Definir arquitectura backend y frontend.
- Revisar el enfoque de integración IoT.
- Documentar decisiones técnicas.
- Preparar estructura de documentación.
- Definir stack, endpoints, schemas, fases y convenciones.
- Implementar la fase foundation + core backend.
- Generar pruebas automatizadas de backend y frontend foundation.
- Crear configuración Docker y scripts de setup.
- Implementar el primer bloque backend de IoT y SSE.
- Endurecer lifecycle MQTT/SSE del backend y agregar pruebas reales de integración IoT.
- Implementar features frontend de spaces, reservations y admin dashboard sobre la arquitectura feature-based.
- Diseñar el sistema visual con acento indigo, primitivos compartidos y consumo SSE vía `fetch` + `ReadableStream`.

## Decisiones tomadas con apoyo de AI

Backend:

- Node.js + Express + TypeScript.
- Hexagonal Architecture / Ports & Adapters.
- PostgreSQL + Prisma.
- Zod, mqtt.js, SSE, Pino, Swagger.
- Vitest + Supertest.

Frontend:

- React + TypeScript + Vite.
- Feature-Based Architecture.
- React Router, Axios, TanStack Query.
- React Hook Form + Zod.
- Tailwind, Motion, Sonner, Recharts.
- Vitest + React Testing Library + MSW.

Infra:

- Docker Compose raíz.
- PostgreSQL.
- Mosquitto.
- iot-simulator como black box.

## Límites

La AI no debe:

- Modificar el simulador.
- Inventar contratos no documentados.
- Cambiar decisiones sin actualizar docs.
- Saltarse validaciones.
- Omitir manejo de errores.
- Omitir tests mínimos.

## Registro inicial

| Uso | Resultado |
|---|---|
| Análisis de requerimientos | Requerimiento consolidado |
| Decisiones de arquitectura | Backend Hexagonal, Frontend Feature-Based |
| IoT | Integración por MQTT sin modificar simulador |
| Stack técnico | Node/Express, React/Vite, PostgreSQL/Prisma |
| Documentación | README, AGENTS, AI, requirements, phases, status |

Este documento debe actualizarse si la AI se usa para generar código, tests o documentación adicional.

## Registro de implementación

| Uso | Resultado |
|---|---|
| Foundation backend | Express, TypeScript, health, Swagger, API key, logging y error handling |
| Database foundation | Prisma multi-schema, migración inicial y seed `SITE_A/OFFICE_1/OFFICE_2` |
| Core API | Places, spaces y reservations con arquitectura hexagonal |
| Reservation rules | Conflicto, límite semanal, cancelación y expiración dinámica |
| Frontend foundation | Vite, React Router, Axios, TanStack Query, Tailwind, Sonner y MSW |
| Docker | Compose raíz con backend, frontend, Postgres, MQTT y simulador black box |
| Tests | Vitest/Supertest backend y Vitest/RTL frontend |
| Backend IoT | Procesamiento MQTT, endpoints admin IoT y stream SSE |
| Backend IoT hardening | Contrato SSE alineado, errores `502` en desired publish, timezone-aware office hours y suite real MQTT/API/DB |
| Frontend Spaces (Phase 02) | Feature module con Zod wire schemas, `placesApi` y `spacesApi`, `useSpaces`/`useSpace`, lista y detalle con loading/empty/error |
| Frontend Reservations (Phase 03) | Reservations con TanStack mutations, RHF + Zod, paginación, cancel + Sonner toasts |
| Frontend Design system | `shared/ui` (Button, Card, Badge, EmptyState, ErrorState, PageHeader, Skeleton, iconos inline) e indigo brand tokens; fix de cascade `@layer` para utilidades sobre links |
| Frontend Admin Dashboard (Phase 04) | Monitoring snapshot + alerts + device desired/reported, RHF form de control, Recharts live chart y SSE consumido vía `fetch` + `ReadableStream` con reconexión |
| Frontend Tests & Docs (Phase 05) | Tests SSE parser, code splitting con `React.lazy` para reservations y admin (initial bundle 1014 → 375 KB), docs y phase status actualizados |
| OpenAPI coverage fix | Swagger/OpenAPI documenta health, places, spaces, reservations y admin IoT con schemas compartidos, errores reutilizables y contrato SSE |
