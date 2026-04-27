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
