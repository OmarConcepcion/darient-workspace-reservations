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
