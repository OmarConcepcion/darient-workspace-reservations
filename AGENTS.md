# AGENTS.md

Instrucciones para AI agents, asistentes de código y desarrolladores.

## Principio general

Este proyecto sigue **Spec-Driven Development (SDD) with AI**. Antes de implementar, revisar requerimientos, decisiones y documentación.

## Orden de lectura obligatorio

1. `README.md`
2. `AI.md`
3. `AGENTS.md`
4. `docs/requirement.md`
5. `backend/docs/requirement.md`
6. `frontend/docs/requirement.md`

## Reglas obligatorias

- Mantener documentación actualizada cuando cambien endpoints, schemas, decisiones o fases.
- Actualizar `pending.md` y `completed.md` según avance.
- No crear fases infinitas; máximo 5 fases generales.
- No cambiar una decisión cerrada sin documentarlo.
- No agregar librerías nuevas sin justificación.
- Mantener trazabilidad con commits pequeños y descriptivos: un commit por subtarea o bloque funcional acordado.

## Reglas de etiquetado de fases

Cada archivo de fase en `docs/phases/`, `backend/docs/phases/` y `frontend/docs/phases/` debe reflejar su estado tanto en el **nombre del archivo** como en el **contenido interno**.

### Sufijo en el nombre del archivo

El nombre del archivo debe terminar con el estado de la fase antes de la extensión:

| Estado | Sufijo en nombre de archivo | Ejemplo |
|---|---|---|
| Completada | `.COMPLETED` | `phase-01-foundation.COMPLETED.md` |
| En progreso (parcial) | `.PARTIAL` | `phase-03-iot-integration.PARTIAL.md` |
| Pendiente | `.PENDING` | `phase-04-frontend-dashboard.PENDING.md` |

Cuando una fase cambie de estado, **renombrar el archivo** para que el sufijo refleje el nuevo estado.

### Estructura interna del archivo de fase

La segunda línea del archivo debe incluir el badge de estado:

```md
> **STATUS: ✅ COMPLETED**   ← fase completa
> **STATUS: 🔄 IN PROGRESS** ← fase parcial
> **STATUS: ⏳ PENDING**     ← fase pendiente
```

Para fases **PARTIAL**: primero la sección `## Pending` con las tareas `[ ]` sin completar, luego la sección `## Completed` con las tareas `[x]` ya hechas.

Para fases **COMPLETED**: solo la sección `## Completed` con todas las tareas `[x]`.

Para fases **PENDING**: solo la sección `## Pending` con todas las tareas `[ ]` pendientes.

## Reglas del iot-simulator

El `iot-simulator` es una caja negra.

Prohibido:

- Modificar su código.
- Copiar su lógica.
- Importarlo dentro del backend.
- Cambiar su comportamiento.
- Conectar el frontend directo a MQTT.

Permitido:

- Leer su README y código para conocer tópicos/payloads.
- Ejecutarlo como contenedor en el mismo cluster Docker.
- Integrarse por MQTT.

Tópicos:

```txt
sites/+/offices/+/telemetry
sites/+/offices/+/reported
sites/{site_id}/offices/{office_id}/desired
```

## Backend

Arquitectura: **Hexagonal Architecture / Ports & Adapters**.

Estructura esperada:

```txt
backend/src/
  app/
  config/
  shared/
  modules/
    places/
    spaces/
    reservations/
    iot/
```

Cada módulo debe seguir:

```txt
domain/
application/
ports/
infrastructure/
presentation/
```

Reglas:

- Controllers delgados.
- Use cases con lógica de aplicación.
- Reglas de negocio sin Express ni Prisma.
- Repositories implementados en infrastructure.
- Puertos/interfaces en `ports`.
- Validación con Zod en los bordes.

## Frontend

Arquitectura: **Feature-Based Architecture**.

Estructura esperada:

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

Reglas:

- No concentrar lógica en componentes.
- API client centralizado.
- Server state con TanStack Query.
- Formularios con React Hook Form + Zod.
- Feedback visual con Sonner e inline errors.

## Convenciones

| Área | Convención |
|---|---|
| Código TS | `camelCase` |
| Clases | `PascalCase` |
| DB schemas/tables/columns | `snake_case` |
| Endpoints | `snake_case` |
| Env vars | `UPPER_SNAKE_CASE` |

## Testing

Backend mínimo:

- Use cases de reservas.
- Conflicto de horario.
- Límite semanal.
- Endpoints principales.
- Procesamiento IoT si da tiempo.

Frontend mínimo:

- Render de páginas principales.
- Formulario de reservas.
- Estados loading/error.
- Dashboard básico.

## Criterio de aceptación de cambios

Un cambio debe:

- Respetar arquitectura aprobada.
- Mantener convenciones.
- No modificar el simulador.
- Actualizar documentación relacionada.
- Mantener o agregar tests cuando aplique.
