import { logger } from "../../../shared/logger/logger.js";
import { AppError } from "../../../shared/errors/app-error.js";
import type { IotService } from "../application/iot-service.js";
import { parseIotTopic } from "../application/topic-parser.js";
import { SharedMqttClient } from "./shared-mqtt-client.js";

export class MqttRuntime {
  private started = false;

  public constructor(
    private readonly client: SharedMqttClient,
    private readonly iotService: IotService
  ) {}

  public async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.started = true;
    this.client.on("reconnect", () => {
      logger.warn("mqtt runtime reconnecting");
    });
    this.client.on("offline", () => {
      logger.warn("mqtt runtime offline");
    });
    this.client.on("close", () => {
      logger.warn("mqtt runtime connection closed");
    });
    this.client.on("error", (error: Error) => {
      logger.error({ error: error.message }, "mqtt runtime error");
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

    await this.client.connect();
    logger.info("mqtt runtime connected");
    await this.client.subscribe("sites/+/offices/+/telemetry");
    await this.client.subscribe("sites/+/offices/+/reported");
    logger.info("mqtt runtime subscribed to telemetry and reported topics");
  }

  public async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    this.started = false;
    await this.client.disconnect();
    logger.info("mqtt runtime stopped");
  }
}
