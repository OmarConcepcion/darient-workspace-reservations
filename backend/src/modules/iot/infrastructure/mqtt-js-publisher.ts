import mqtt from "mqtt";

import { getEnv } from "../../../config/env.js";
import type { MqttPublisher } from "../ports/mqtt-publisher.js";

export class MqttJsPublisher implements MqttPublisher {
  private client = mqtt.connect(getEnv().MQTT_URL);

  public async publishJson(
    topic: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.client.publish(topic, JSON.stringify(payload), { qos: 0 }, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}
