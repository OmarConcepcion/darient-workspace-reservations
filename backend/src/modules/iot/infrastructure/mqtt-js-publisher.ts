import type { MqttPublisher } from "../ports/mqtt-publisher.js";
import { SharedMqttClient } from "./shared-mqtt-client.js";

export class MqttJsPublisher implements MqttPublisher {
  public constructor(private readonly client: SharedMqttClient) {}

  public async publishJson(
    topic: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    await this.client.publishJson(topic, payload);
  }
}
