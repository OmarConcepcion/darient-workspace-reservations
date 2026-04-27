export type SseEventName =
  | "telemetry_updated"
  | "alert_updated"
  | "device_reported_updated"
  | "device_desired_updated";

export type SsePublisher = {
  publish(event: SseEventName, data: unknown): void;
};
