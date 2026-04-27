import mqtt from "mqtt";

import { getEnv } from "../../../config/env.js";
import { logger } from "../../../shared/logger/logger.js";
import { AppError } from "../../../shared/errors/app-error.js";
import type { IotService } from "../application/iot-service.js";
import { parseIotTopic } from "../application/topic-parser.js";

export class MqttRuntime {
  private client = mqtt.connect(getEnv().MQTT_URL);

  public constructor(private readonly iotService: IotService) {}

  public start(): void {
    this.client.on("connect", () => {
      this.client.subscribe("sites/+/offices/+/telemetry");
      this.client.subscribe("sites/+/offices/+/reported");
      logger.info("mqtt runtime subscribed to telemetry and reported topics");
    });

    this.client.on("message", async (topic, payload) => {
      try {
        const parsed = parseIotTopic(topic);

        if (parsed.messageType === "telemetry") {
          await this.iotService.processTelemetryMessage(topic, payload.toString());
          return;
        }

        if (parsed.messageType === "reported") {
          await this.iotService.processReportedMessage(topic, payload.toString());
        }
      } catch (error) {
        const message =
          error instanceof AppError || error instanceof Error
            ? error.message
            : "Unknown MQTT processing error.";
        logger.error({ topic, error: message }, "failed to process mqtt message");
      }
    });

    this.client.on("error", (error) => {
      logger.error({ error: error.message }, "mqtt runtime error");
    });
  }
}
