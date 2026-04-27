# Simulador MQTT – Especificación Técnica

## 📡 Tópicos y Ejemplos de Payload

### `sites/{siteId}/offices/{officeId}/telemetry`

```json
{
  "ts": "2025-10-08T14:30:00Z",
  "temp_c": 24.1,
  "humidity_pct": 49.3,
  "co2_ppm": 930,
  "occupancy": 4,
  "power_w": 120
}
```

### `sites/{siteId}/offices/{officeId}/desired`

```json
{
  "samplingIntervalSec": 10,
  "co2_alert_threshold": 1000
}
```

### `sites/{siteId}/offices/{officeId}/reported`

```json
{
  "ts": "2025-10-08T14:30:00Z",
  "samplingIntervalSec": 10,
  "co2_alert_threshold": 1000,
  "firmwareVersion": "1.0.0"
}
```

---

## 🧩 Descripción General del Sistema

El simulador representa un **dispositivo IoT** asociado a una **oficina** ("espacio") dentro de una **sede** (“site” o "lugar").
Cada oficina:

- **Publica lecturas periódicas** de sensores a través del tópico `telemetry`.
- **Recibe configuraciones** (frecuencia de muestreo, umbral de CO₂, etc.) mediante el tópico `desired`.
- **Confirma su estado** al aplicar configuraciones publicando en el tópico `reported`.

El lado **nube** (la aplicación del candidato) debe implementar un **suscriptor** que:

1. Reciba los mensajes de `telemetry`.
2. Procese las lecturas y genere agregaciones en la tabla `telemetry_aggregations` (las agregaciones específicas quedan a criterio del candidato).
3. Compare las lecturas con la configuración y las reglas vigentes.
4. Genere eventos o alertas cuando se cumplan condiciones anómalas.

---

## 🚨 Reglas de Alerta a Implementar

### 1️⃣ CO₂ alto (`CO2`)

- **Abrir:** `co2_ppm > co2_alert_threshold` durante **5 minutos consecutivos**.
- **Resolver:** `co2_ppm <= threshold` durante **2 minutos consecutivos**.
- **Fuente:** `device_desired.co2_alert_threshold`.
- **Objetivo:** detectar mala ventilación o exceso de ocupación.

---

### 2️⃣ Ocupación máxima excedida (`OCCUPANCY_MAX`)

- **Abrir:** `occupancy > offices.capacity` durante **2 minutos consecutivos**.
- **Resolver:** `occupancy <= capacity` durante **1 minuto consecutivo**.
- **Fuente:** `offices.capacity`.
- **Objetivo:** detectar sobreocupación o incumplimiento de aforo.

---

### 3️⃣ Ocupación inesperada (`OCCUPANCY_UNEXPECTED`)

Dos variantes:

#### a) Fuera de horario laboral

- **Abrir:** `occupancy > 0` durante **10 minutos consecutivos** fuera del horario configurado.
- **Resolver:** `occupancy == 0` durante **5 minutos** o regreso al horario válido.
- **Fuente:** `office_hours (apertura, cierre, tz)`.
- **Objetivo:** detectar presencia no autorizada fuera del horario laboral.

#### b) Dentro del horario pero sin citas programadas

- **Abrir:** `occupancy > 0` durante **10 minutos** dentro del horario laboral
  **sin citas activas** en la tabla `appointments`.
- **Resolver:** `occupancy == 0` durante **5 minutos** o al registrarse una cita activa.
- **Fuente:** `appointments(office_id, starts_at, ends_at, ...)`.
- **Objetivo:** detectar uso imprevisto de espacios reservables.

---

## 📊 Eventos Esperados (nube → interfaz / registros)

Cuando se cumpla una condición de alerta, el backend debe:

1. Insertar o actualizar una fila en la tabla `alerts` con:

   - `office_id`
   - `kind` (`CO2`, `OCCUPANCY_MAX`, `OCCUPANCY_UNEXPECTED`)
   - `started_at`, `resolved_at`
   - `meta_json` con detalles (valores, umbrales, timestamps)

2. Notificar el estado actual de la oficina en el panel o endpoint correspondiente.

---

## ⚙️ Comportamiento del Simulador

- Envía lecturas cada `samplingIntervalSec`.
- Escucha y aplica configuraciones recibidas por `desired`.
- Reporta su configuración actual por `reported`.
- **No valida lógica de negocio:**
  las alertas y reglas deben manejarse **exclusivamente en el backend del candidato.**

---

## 🔁 Ejemplo de Flujo Completo

1. **Set-up**

   - Instalar dependencias con `npm i`
   - Crear archivo `.env` que cumpla con lo esperado en `.env.example`
   - Correr MQTT Broker con `docker compose -f docker.compose.yml up -d`

2. **Ejecutar el simulador con identificadores de sitio y oficina**

   _Esta sección asume que la parte requerida de la prueba ya fué hecha, y tienes acceso a IDs de un **sitio** (o "lugar") y de una **oficina** (o "espacio"), que fueron creadas en tu base de datos local_

   Cada instancia del simulador representa un dispositivo IoT asignado a una oficina específica.
   Para ejecutarlo, indica los IDs de **sitio** y **oficina** como argumentos en la línea de comandos:

   ```bash
   node index.js --site-id SITE_A --office-id OFFICE_1
   ```

   > 🧩 Esto permite lanzar **múltiples simuladores en paralelo**, cada uno con su propia configuración:
   >
   > ```bash
   > node index.js --site-id SITE_A --office-id OFFICE_1
   > node index.js --site-id SITE_A --office-id OFFICE_2
   > node index.js --site-id SITE_B --office-id OFFICE_3
   > ```
   >
   > Cada proceso publicará mensajes MQTT en sus propios tópicos:
   >
   > ```txt
   > sites/SITE_A/offices/OFFICE_1/telemetry
   > sites/SITE_A/offices/OFFICE_1/reported
   > sites/SITE_A/offices/OFFICE_1/desired
   > ```

3. **Publicar una configuración deseada**

   Desde otra terminal, ejecuta:

   ```bash
   node send-desired.js --site-id SITE_A --office-id OFFICE_1 --interval 5 --co2 900
   ```

   Esto publicará el mensaje `desired` para esa oficina, modificando el intervalo de muestreo y el umbral de CO₂.

4. **El simulador aplica la configuración**

   El dispositivo simulado ajusta su frecuencia a **5 segundos** y confirma el cambio publicando su nuevo estado en el tópico `reported`.

5. **El backend suscrito procesa la telemetría**

   El backend recibe lecturas cada 5 s y aplica las reglas definidas:

   - Si `co2_ppm > 900` por 5 min → **alerta `CO2`**

   - Si `occupancy > capacity` → **alerta `OCCUPANCY_MAX`**

   - Si `occupancy > 0` fuera de horario o sin citas → **alerta `OCCUPANCY_UNEXPECTED`**

   > 💡 Puedes modificar `BASE_OCCUPANCY` o `BASE_CO2_PPM` en el `.env` del simulador para “forzar” condiciones y verificar el funcionamiento de tu consumidor MQTT.

6. **Visualización en el panel**

   La interfaz administrativa debe reflejar el estado actual de cada oficina, mostrando:

   - Últimos valores de telemetría desde `telemetry_aggregations`.
   - Configuración deseada y reportada (gemelo digital).
   - Alertas activas e históricas.

---

## 🧠 Digital Twin (Gemelo Digital)

Un componente **fundamental** de la evaluación es el manejo del **Gemelo Digital**, que sincroniza **únicamente la configuración y el estado del dispositivo** entre el sistema físico (simulador) y la nube.

**⚠️ Importante:** El Gemelo Digital **NO debe persistir datos empíricos** como lecturas de telemetría, temperatura, ocupación, etc. Estos datos deben procesarse en una tabla `telemetry_aggregations` que realice agregaciones (las agregaciones específicas quedan a criterio del candidato) y debe manejarse por separado del gemelo digital.

| Estado                     | Fuente                       | Descripción                                                                      |
| -------------------------- | ---------------------------- | -------------------------------------------------------------------------------- |
| **Deseado (`desired`)**    | Publicado por la nube        | Configuración que el dispositivo debería aplicar (p. ej. umbral CO₂, intervalo). |
| **Reportado (`reported`)** | Publicado por el dispositivo | Estado real del dispositivo (p. ej. firmware, intervalo actual).                 |

El backend debe:

1. **Persistir ambos estados** (`device_desired` y `device_reported`) en tablas separadas **(solo configuración, no datos empíricos)**.
2. **Detectar divergencias** entre ellos.
3. Permitir que un usuario administrador **actualice el estado deseado** desde la UI, publicando el cambio al tópico MQTT correspondiente.

---

## 🖥️ Interfaz de Administración de Oficinas

Los candidatos deben desarrollar una **UI administrativa (solo para admins)** que integre:

- Datos recientes de **telemetría** desde la tabla `telemetry_aggregations` (`temp_c`, `humidity_pct`, `co2_ppm`, `occupancy`, etc.).
- Estado del **gemelo digital** (deseado vs reportado).
- **Alertas activas e históricas**, con tiempos y tipo.
- **Horario laboral y capacidad** configurada de la oficina.
- Opción para **editar configuraciones** (`samplingIntervalSec`, `co2_alert_threshold`, etc.) y publicar al tópico `desired`.

> 💡 _Sugerencia:_ el panel puede construirse con tarjetas o pestañas por oficina, combinando las tablas `offices`, `alerts`, `device_desired`, `device_reported` y `telemetry_aggregations`.

---

## 🧩 Tips para Candidatos

- **Forzar condiciones de prueba:**
  Aumenta `BASE_OCCUPANCY` o `BASE_CO2_PPM` en el `.env` para probar fácilmente tus alertas.

- **Validar el gemelo digital:**
  Después de enviar una configuración (`send-desired.js` o tu propia UI), verifica que:

  - El simulador publique el `reported` esperado.
  - Las tablas `device_desired` y `device_reported` se mantengan coherentes.

- **Resiliencia:**
  Usa _retained messages_ en MQTT para que el dispositivo recupere la última configuración al reconectarse.

- **Arquitectura limpia:**
  Mantén la lógica separada por tipo de mensaje (`telemetry`, `reported`), facilitando la escalabilidad.

- **Visualización clara:**
  No se evalúa el diseño estético, sino la **trazabilidad** entre MQTT → base de datos → UI.

- **Documentación:**
  En tu propio README explica cómo probar cada alerta y cómo verificar la sincronización del gemelo digital.

---

> 🎯 **Objetivo de la prueba:** evaluar tu capacidad para diseñar una arquitectura IoT completa, comprendiendo el rol del _Gemelo Digital_ como puente entre el simulador y el sistema en la nube — desde el flujo MQTT hasta la administración y monitoreo en tiempo real.

---

## 📚 Consideraciones Finales

- Las ventanas de tiempo (5 min, 2 min, etc.) pueden parametrizarse como constantes.
- La verificación de horarios y citas debe considerar la zona horaria del sitio.
- Puedes ejecutar varios simuladores en paralelo corriendo `node index.js --site-id ${SITE_ID}$ --office-id ${OFFICE_ID}` en pestañas de terminal distintas y utilizando distintos identificadores

---

✅ **Resultado esperado:** un sistema funcional, modular y trazable, con un panel administrativo capaz de visualizar, configurar y monitorear cada oficina en tiempo real.
