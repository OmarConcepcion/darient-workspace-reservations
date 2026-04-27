import type {
  AlertUpdatedPayload,
  DeviceReportedUpdatedPayload,
  TelemetryUpdatedPayload
} from "../schemas/sse-events";

export type EventStreamHandlers = {
  telemetry_updated?: (payload: TelemetryUpdatedPayload) => void;
  alert_updated?: (payload: AlertUpdatedPayload) => void;
  device_reported_updated?: (payload: DeviceReportedUpdatedPayload) => void;
};

type ConnectArgs = {
  baseUrl: string;
  apiKey: string;
  signal: AbortSignal;
  handlers: EventStreamHandlers;
  onOpen?: () => void;
  onError?: (error: unknown) => void;
};

export const connectEventStream = async ({
  baseUrl,
  apiKey,
  signal,
  handlers,
  onOpen,
  onError
}: ConnectArgs): Promise<void> => {
  const response = await fetch(`${baseUrl}/admin/events/stream`, {
    headers: {
      "x-api-key": apiKey,
      Accept: "text/event-stream"
    },
    signal
  });

  if (!response.ok || !response.body) {
    throw new Error(`SSE connection failed with status ${response.status}`);
  }

  onOpen?.();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? "";

      for (const raw of events) {
        const trimmed = raw.trim();
        if (!trimmed || trimmed.startsWith(":")) {
          continue;
        }

        let eventName: string | null = null;
        let dataText = "";
        for (const line of trimmed.split(/\r?\n/)) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataText += line.slice(5).trim();
          }
        }

        if (!eventName || !dataText) {
          continue;
        }

        try {
          const data = JSON.parse(dataText);
          const handler = (handlers as Record<string, (payload: unknown) => void>)[
            eventName
          ];
          handler?.(data);
        } catch (error) {
          onError?.(error);
        }
      }
    }
  } catch (error) {
    if ((error as { name?: string }).name === "AbortError") {
      return;
    }
    throw error;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // reader already released
    }
  }
};
