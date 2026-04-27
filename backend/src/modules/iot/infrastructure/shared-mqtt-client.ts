import mqtt, { type IClientOptions, type MqttClient } from "mqtt";

import { getEnv } from "../../../config/env.js";

type MessageHandler = (topic: string, payload: Buffer) => void | Promise<void>;

export class SharedMqttClient {
  private readonly client: MqttClient;
  private connectPromise: Promise<void> | null = null;

  public constructor(options: IClientOptions = {}) {
    this.client = mqtt.connect(getEnv().MQTT_URL, {
      reconnectPeriod: 1_000,
      manualConnect: true,
      ...options
    });
  }

  public on(
    event:
      | "connect"
      | "reconnect"
      | "offline"
      | "close"
      | "error"
      | "message",
    handler:
      | (() => void)
      | ((error: Error) => void)
      | MessageHandler
  ): void {
    if (event === "message") {
      this.client.on(event, handler as MessageHandler);
      return;
    }

    this.client.on(event, handler as () => void);
  }

  public async connect(): Promise<void> {
    if (this.client.connected) {
      return;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        this.client.off("connect", handleConnect);
        this.client.off("error", handleError);
      };

      const handleConnect = () => {
        cleanup();
        this.connectPromise = null;
        resolve();
      };

      const handleError = (error: Error) => {
        cleanup();
        this.connectPromise = null;
        reject(error);
      };

      this.client.once("connect", handleConnect);
      this.client.once("error", handleError);
      this.client.connect();
    });

    return this.connectPromise;
  }

  public async subscribe(topic: string): Promise<void> {
    await this.connect();

    await new Promise<void>((resolve, reject) => {
      this.client.subscribe(topic, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  public async publishJson(topic: string, payload: Record<string, unknown>): Promise<void> {
    await this.connect();

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

  public async disconnect(force = false): Promise<void> {
    if (!this.client.connected && !this.client.reconnecting) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      this.client.end(force, {}, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}
