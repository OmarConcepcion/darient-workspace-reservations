import { randomUUID } from "node:crypto";
import { Router } from "express";

import { asyncHandler } from "../../../shared/http/async-handler.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { InMemorySsePublisher } from "../../../shared/sse/in-memory-sse-publisher.js";
import { IotService } from "../application/iot-service.js";
import type { IotRepository } from "../ports/iot-repository.js";
import type { MqttPublisher } from "../ports/mqtt-publisher.js";
import { toAlertResponse, toDeviceDesiredResponse, toMonitoringResponse } from "./iot-mapper.js";
import { spaceIdParamsSchema, updateDeviceDesiredSchema } from "./iot-schemas.js";

export const createIotAdminRouter = (
  iotRepository: IotRepository,
  mqttPublisher: MqttPublisher,
  ssePublisher: InMemorySsePublisher,
  nowProvider?: () => Date
): Router => {
  const router = Router();
  const iotService = new IotService(
    iotRepository,
    mqttPublisher,
    ssePublisher,
    nowProvider
  );

  /**
   * @openapi
   * /admin/spaces/{space_id}/monitoring:
   *   get:
   *     tags:
   *       - Admin IoT
   *     summary: Get monitoring snapshot for a space
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: space_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       "200":
   *         description: Monitoring snapshot retrieved successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/MonitoringResponse"
   *       "400":
   *         $ref: "#/components/responses/ValidationError"
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "404":
   *         description: Space not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *             example:
   *               error:
   *                 code: SPACE_NOT_FOUND
   *                 message: Space not found.
   *                 details: {}
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   */
  router.get(
    "/spaces/:space_id/monitoring",
    asyncHandler(async (request, response) => {
      const { space_id: spaceId } = spaceIdParamsSchema.parse(request.params);
      const monitoring = await iotService.getMonitoring(spaceId);
      response.json(toMonitoringResponse(monitoring));
    })
  );

  router.get(
    "/spaces/:space_id/alerts",
    asyncHandler(async (request, response) => {
      const { space_id: spaceId } = spaceIdParamsSchema.parse(request.params);
      const alerts = await iotService.listAlerts(spaceId);
      response.json({ data: alerts.map(toAlertResponse) });
    })
  );

  /**
   * @openapi
   * /admin/spaces/{space_id}/alerts:
   *   get:
   *     tags:
   *       - Admin IoT
   *     summary: List active and resolved alerts for a space
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: space_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       "200":
   *         description: Alerts retrieved successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/AlertListResponse"
   *       "400":
   *         $ref: "#/components/responses/ValidationError"
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "404":
   *         description: Space not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *             example:
   *               error:
   *                 code: SPACE_NOT_FOUND
   *                 message: Space not found.
   *                 details: {}
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   * /admin/spaces/{space_id}/device_desired:
   *   patch:
   *     tags:
   *       - Admin IoT
   *     summary: Update desired device configuration for a space
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: space_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/UpdateDeviceDesiredRequest"
   *     responses:
   *       "200":
   *         description: Desired device state updated and published successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DeviceDesired"
   *       "400":
   *         $ref: "#/components/responses/ValidationError"
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "404":
   *         description: Space not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *             example:
   *               error:
   *                 code: SPACE_NOT_FOUND
   *                 message: Space not found.
   *                 details: {}
   *       "502":
   *         $ref: "#/components/responses/MqttPublishFailedError"
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   */
  router.patch(
    "/spaces/:space_id/device_desired",
    asyncHandler(async (request, response) => {
      const { space_id: spaceId } = spaceIdParamsSchema.parse(request.params);
      const body = updateDeviceDesiredSchema.parse(request.body);
      const desired = await iotService.updateDeviceDesired(spaceId, {
        samplingIntervalSec: body.sampling_interval_sec,
        co2AlertThreshold: body.co2_alert_threshold
      });
      response.json(toDeviceDesiredResponse(desired));
    })
  );

  /**
   * @openapi
   * /admin/events/stream:
   *   get:
   *     tags:
   *       - Admin IoT
   *     summary: Subscribe to server-sent telemetry events
   *     description: |
   *       Opens a `text/event-stream` connection. The backend emits the following events:
   *
   *       - `telemetry_updated`
   *       - `alert_updated`
   *       - `device_reported_updated`
   *
   *       Each event payload is JSON encoded in the SSE `data:` field.
   *     security:
   *       - ApiKeyAuth: []
   *     responses:
   *       "200":
   *         description: SSE stream established successfully.
   *         content:
   *           text/event-stream:
   *             schema:
   *               type: string
   *               example: |
   *                 event: telemetry_updated
   *                 data: {"space_id":"11111111-1111-4111-8111-111111111111","iot_site_id":"SITE_A","iot_office_id":"OFFICE_1","avg_co2_ppm":920,"max_occupancy":4,"window_start":"2026-04-27T14:00:00.000Z","window_end":"2026-04-27T14:01:00.000Z"}
   *
   *                 event: alert_updated
   *                 data: {"alert_id":"22222222-2222-4222-8222-222222222222","space_id":"11111111-1111-4111-8111-111111111111","type":"CO2","status":"OPEN","started_at":"2026-04-27T14:00:00.000Z","resolved_at":null}
   *       "401":
   *         $ref: "#/components/responses/UnauthorizedError"
   *       "500":
   *         $ref: "#/components/responses/InternalServerError"
   */
  router.get("/events/stream", (request, response) => {
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    response.flushHeaders?.();

    const clientId = randomUUID();
    ssePublisher.addClient(clientId, response);
    response.write(": connected\n\n");

    request.on("close", () => {
      ssePublisher.removeClient(clientId);
      response.end();
    });
  });

  return router;
};

export const createIotServiceForRuntime = (
  iotRepository: IotRepository,
  mqttPublisher: MqttPublisher,
  ssePublisher: InMemorySsePublisher,
  nowProvider?: () => Date
) => new IotService(iotRepository, mqttPublisher, ssePublisher, nowProvider);
