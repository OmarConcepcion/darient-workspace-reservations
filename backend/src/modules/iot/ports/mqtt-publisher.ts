export type MqttPublisher = {
  publishJson(topic: string, payload: Record<string, unknown>): Promise<void>;
};
