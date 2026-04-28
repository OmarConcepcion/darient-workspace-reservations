# AI.md

## Uso responsable de Inteligencia Artificial

Este documento explica cómo se utilizó Inteligencia Artificial (AI) durante el desarrollo de este proyecto.

La AI fue utilizada como una herramienta de apoyo para análisis, documentación, revisión, organización e implementación asistida. Sin embargo, no reemplazó el criterio técnico del desarrollador, ni tomó las decisiones arquitectónicas, funcionales o de entrega del proyecto.

La arquitectura del sistema, las decisiones técnicas, el alcance funcional, la organización del código, la estrategia de pruebas y la validación final fueron responsabilidad del desarrollador, tomando como base los requerimientos proporcionados para la prueba técnica de backend, frontend e IoT.

---

## Responsabilidad del desarrollador

El proyecto fue diseñado, estructurado, implementado, revisado y validado bajo la responsabilidad del desarrollador.

El desarrollador fue responsable de:

- Analizar los requerimientos funcionales y técnicos del backend, frontend e IoT.
- Definir la arquitectura general de la solución.
- Seleccionar el stack tecnológico.
- Diseñar el modelo de dominio del backend.
- Definir la estructura de la API.
- Diseñar la estructura del frontend.
- Definir la integración con el simulador IoT sin modificar su lógica.
- Separar correctamente las responsabilidades dentro del código.
- Determinar qué funcionalidades eran obligatorias, cuáles eran complementarias y cuáles correspondían al bonus.
- Revisar el código generado o asistido antes de aceptarlo.
- Ejecutar pruebas y validar el comportamiento del sistema.
- Mantener la solución alineada con el alcance esperado y el tiempo disponible para la entrega.

La AI fue utilizada para acelerar ciertas tareas de análisis, documentación, revisión e implementación, pero las decisiones finales y la responsabilidad técnica del proyecto permanecieron en el desarrollador.

---

## Metodología de desarrollo utilizada

Este proyecto no fue desarrollado improvisando con AI. Se siguió un proceso estructurado para asegurar que la solución tuviera una base clara, mantenible y alineada con los requerimientos.

Durante el desarrollo se utilizaron principalmente dos enfoques:

1. Spec-Driven Development.
2. Test-Driven Development.

---

## Spec-Driven Development

La primera etapa del proyecto se trabajó utilizando un enfoque de Spec-Driven Development.

Antes de iniciar la implementación principal, se analizaron los requerimientos de backend, frontend e IoT para convertirlos en documentación técnica, decisiones de arquitectura, fases de desarrollo, contratos de API y comportamientos esperados.

Este proceso permitió definir desde el inicio:

- Las responsabilidades del backend.
- Las responsabilidades del frontend.
- La relación entre `places`, `spaces`, `reservations` y los dispositivos IoT.
- El contrato de la API.
- La estructura esperada de las respuestas.
- La estrategia de manejo de errores.
- La organización del proyecto.
- El modelo de base de datos.
- La estrategia de persistencia.
- La integración con MQTT.
- El uso de SSE para actualizaciones en tiempo real.
- La configuración local con Docker.
- La estrategia inicial de pruebas.
- Los límites de integración con el simulador IoT.

La AI fue utilizada en esta etapa como apoyo para organizar ideas, revisar alternativas y estructurar documentación. Sin embargo, la interpretación de los requerimientos, las decisiones finales y la dirección técnica fueron definidas por el desarrollador.

---

## Test-Driven Development

Luego de la etapa de especificación y planificación, el desarrollo se apoyó en un enfoque de Test-Driven Development.

El flujo de trabajo utilizado fue:

1. Definir el comportamiento esperado.
2. Crear o ajustar pruebas para validar ese comportamiento.
3. Ejecutar las pruebas y confirmar que fallaban cuando la funcionalidad aún no estaba implementada.
4. Desarrollar el código necesario.
5. Ejecutar nuevamente las pruebas hasta que pasaran correctamente.
6. Refactorizar o mejorar la implementación manteniendo las pruebas en verde.

Este enfoque ayudó a validar reglas importantes del sistema, especialmente en áreas como:

- Creación de reservas.
- Validación de conflictos de horarios.
- Restricción de reservas activas por cliente.
- Endpoints de la API.
- Manejo de errores.
- Procesamiento de datos IoT.
- Integración entre backend y frontend.
- Comportamientos principales de la interfaz.

El objetivo de usar TDD fue reducir la dependencia de pruebas manuales y asegurar que las reglas principales del sistema estuvieran respaldadas por pruebas automatizadas.

---

## Cómo se utilizó AI

La AI fue utilizada como herramienta de apoyo en las siguientes áreas:

### Análisis de requerimientos

La AI ayudó a organizar y revisar los requerimientos de backend, frontend e IoT para convertirlos en un plan de desarrollo más claro.

Esto incluyó apoyo para identificar:

- Entidades principales.
- Endpoints requeridos.
- Reglas de negocio.
- Restricciones técnicas.
- Requerimientos del bonus IoT.
- Necesidades de documentación.
- Necesidades de pruebas.
- Posibles riesgos de implementación.

La validación final de estos puntos fue realizada por el desarrollador.

---

### Apoyo en documentación

La AI fue utilizada para apoyar la redacción y organización de documentación del proyecto, incluyendo:

- Documentación de requerimientos.
- Decisiones técnicas.
- Fases de desarrollo.
- Estado del proyecto.
- Mejoras al README.
- Documentación sobre el uso de AI.

Toda la documentación fue revisada y ajustada por el desarrollador para asegurar que coincidiera con la implementación real del proyecto.

---

### Apoyo en revisión de arquitectura

La AI fue utilizada para comparar, validar y documentar alternativas de arquitectura. Sin embargo, las decisiones arquitectónicas finales fueron tomadas por el desarrollador.

Las decisiones se tomaron considerando:

- Los requerimientos de la prueba.
- La separación de responsabilidades.
- La mantenibilidad del código.
- La facilidad de prueba.
- La integración con IoT.
- La claridad de la API.
- El tiempo disponible para la entrega.

Entre las decisiones principales se encuentran:

- Backend con Node.js, Express y TypeScript.
- Organización backend basada en Hexagonal Architecture / Ports and Adapters.
- PostgreSQL como base de datos relacional.
- Prisma como ORM.
- API versionada bajo `/api/v1`.
- Autenticación mediante API key.
- Validaciones centralizadas.
- Manejo de errores consistente.
- Frontend con React, TypeScript y Vite.
- Organización frontend basada en Feature-Based Architecture.
- Docker Compose para ambiente local.
- Integración con MQTT para telemetría IoT.
- Uso de SSE para actualizaciones en tiempo real.
- Uso del simulador IoT como una caja negra, sin modificar su lógica.

---

### Apoyo en implementación

La AI fue utilizada como apoyo durante la implementación para:

- Proponer estructuras iniciales de código.
- Sugerir patrones de implementación.
- Ayudar a crear pruebas.
- Revisar posibles edge cases.
- Mejorar consistencia entre código y documentación.
- Apoyar refactors puntuales.
- Identificar validaciones faltantes.
- Detectar inconsistencias en scripts, documentación o estado del proyecto.

Todo el código asistido por AI fue revisado antes de ser aceptado dentro del proyecto.

---

### Apoyo en pruebas

La AI apoyó en la identificación y redacción de escenarios de prueba, incluyendo:

- Pruebas unitarias.
- Pruebas de integración.
- Pruebas de comportamiento del frontend.
- Validaciones de endpoints.
- Casos relacionados con reservas.
- Casos relacionados con IoT.
- Casos de manejo de errores.

El desarrollador fue responsable de seleccionar las pruebas relevantes, ejecutarlas, revisar los resultados y corregir los errores encontrados.

---

### Apoyo en debugging y revisión

La AI también fue utilizada como una herramienta de revisión para detectar posibles problemas, tales como:

- Validaciones faltantes.
- Documentación incompleta.
- Diferencias entre el README y el estado real del proyecto.
- Riesgos en la creación de reservas.
- Posibles inconsistencias en contratos de API.
- Responsabilidades poco claras dentro del código.
- Áreas donde se podía evitar complejidad innecesaria.

La priorización y aplicación de correcciones fue realizada por el desarrollador.

---

## Qué no hizo la AI

La AI no reemplazó el rol del desarrollador.

La AI no:

- Tomó propiedad de la arquitectura.
- Definió de forma independiente el alcance del proyecto.
- Tomó las decisiones técnicas finales.
- Validó por sí sola la entrega final.
- Reemplazó la revisión manual.
- Reemplazó la ejecución de pruebas.
- Modificó la lógica del simulador IoT.
- Agregó requerimientos fuera del alcance de la prueba.
- Decidió qué debía entregarse sin aprobación del desarrollador.
- Aceptó código sin revisión humana.

El desarrollador mantuvo la responsabilidad sobre la calidad, mantenibilidad, funcionamiento y entrega final del proyecto.

---

## Principales decisiones técnicas

Las siguientes decisiones fueron tomadas por el desarrollador. La AI fue utilizada únicamente como apoyo para análisis, comparación, documentación o implementación asistida.

### Backend

- Node.js.
- Express.
- TypeScript.
- PostgreSQL.
- Prisma ORM.
- Hexagonal Architecture / Ports and Adapters.
- REST API bajo `/api/v1`.
- Autenticación mediante API key.
- Validación de datos con Zod.
- Manejo centralizado de errores.
- Documentación con Swagger/OpenAPI.
- Logging con Pino.
- Pruebas con Vitest y Supertest.

### Frontend

- React.
- TypeScript.
- Vite.
- Feature-Based Architecture.
- React Router.
- Axios para comunicación con la API.
- TanStack Query para manejo de server state.
- React Hook Form y Zod para formularios y validaciones.
- Tailwind CSS para estilos.
- Sonner para notificaciones.
- Recharts para visualización de datos.
- Vitest, React Testing Library y MSW para pruebas.

### Infraestructura

- Docker Compose para levantar el ambiente local.
- Contenedor de PostgreSQL.
- Contenedor de MQTT broker.
- Contenedor de backend.
- Contenedor de frontend.
- Contenedor del simulador IoT.

### IoT

- El simulador IoT no fue modificado.
- El backend consume telemetría desde MQTT.
- Los términos `site` y `office` del simulador fueron mapeados a `place` y `space`.
- El backend procesa y expone información relacionada con telemetría.
- El dashboard administrativo del frontend recibe actualizaciones en tiempo real mediante SSE.

---

## Criterios de calidad aplicados

Durante el desarrollo se aplicaron los siguientes criterios:

- Mantener responsabilidades claramente separadas.
- Evitar complejidad innecesaria.
- Mantener la lógica de dominio fuera de controllers y componentes visuales.
- Validar entradas de datos de forma consistente.
- Retornar errores claros desde la API.
- Documentar los contratos principales.
- Respaldar reglas importantes con pruebas.
- Mantener la documentación alineada con la implementación real.
- Facilitar la ejecución local del proyecto.
- Mantener aislado el simulador IoT.
- Preferir soluciones simples, claras y mantenibles.

---

## Revisión y validación humana

Antes de considerar el proyecto listo para entrega, el desarrollador revisó:

- Cobertura de requerimientos.
- Coherencia entre backend y frontend.
- Consistencia de la API.
- Reglas de negocio de reservas.
- Integración con IoT.
- Configuración de Docker.
- Exactitud de la documentación.
- Pruebas automatizadas.
- Manejo de errores.
- Organización del código.
- Separación de responsabilidades.

La AI fue utilizada como apoyo para una segunda revisión, pero la validación final fue realizada por el desarrollador.

---

## Resumen del uso de AI

| Área | Apoyo de AI | Responsabilidad del desarrollador |
|---|---|---|
| Análisis de requerimientos | Organización y revisión inicial | Validar alcance y entendimiento final |
| Spec-Driven Development | Apoyo en estructurar documentación y fases | Definir dirección técnica y alcance real |
| Arquitectura | Comparación y documentación de alternativas | Tomar decisiones finales |
| Backend | Apoyo con estructuras, pruebas y revisión | Implementar, adaptar y validar |
| Frontend | Apoyo con estructura, UX y comportamiento | Revisar experiencia, integración y resultado final |
| IoT | Apoyo para razonar sobre MQTT y SSE | Definir integración y límites del simulador |
| Testing | Sugerencia de escenarios de prueba | Seleccionar, ejecutar y corregir pruebas |
| Documentación | Redacción y organización asistida | Confirmar exactitud contra el proyecto real |
| Debugging | Identificación de posibles riesgos | Priorizar y aplicar correcciones |

---

## Declaración final

La AI fue utilizada de forma responsable como una herramienta de apoyo para análisis, documentación, implementación asistida, pruebas y revisión.

El proyecto no fue delegado a la AI.

La arquitectura final, las decisiones técnicas, la metodología de desarrollo, la implementación aceptada, la validación y la calidad de la entrega fueron responsabilidad del desarrollador.