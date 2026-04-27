import { useEffect, useRef, useState } from "react";

import {
  connectEventStream,
  type EventStreamHandlers
} from "../api/event-stream";

export type EventStreamStatus =
  | "idle"
  | "connecting"
  | "open"
  | "error"
  | "closed";

type UseEventStreamOptions = {
  enabled?: boolean;
};

const env = (key: "VITE_API_URL" | "VITE_API_KEY"): string => {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  if (key === "VITE_API_URL") {
    return value ?? "http://localhost:3000/api/v1";
  }
  return value ?? "";
};

export const useEventStream = (
  handlers: EventStreamHandlers,
  { enabled = true }: UseEventStreamOptions = {}
): EventStreamStatus => {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const [status, setStatus] = useState<EventStreamStatus>("idle");

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    let attempt = 0;

    const proxyHandlers: EventStreamHandlers = {
      telemetry_updated: (payload) =>
        handlersRef.current.telemetry_updated?.(payload),
      alert_updated: (payload) => handlersRef.current.alert_updated?.(payload),
      device_reported_updated: (payload) =>
        handlersRef.current.device_reported_updated?.(payload)
    };

    const run = async () => {
      while (!cancelled) {
        setStatus(attempt === 0 ? "connecting" : "connecting");
        try {
          await connectEventStream({
            baseUrl: env("VITE_API_URL"),
            apiKey: env("VITE_API_KEY"),
            signal: controller.signal,
            onOpen: () => {
              if (!cancelled) {
                setStatus("open");
              }
            },
            handlers: proxyHandlers
          });
          if (cancelled) {
            setStatus("closed");
            return;
          }
          setStatus("closed");
        } catch (error) {
          if (cancelled || (error as { name?: string }).name === "AbortError") {
            return;
          }
          setStatus("error");
        }

        attempt += 1;
        const delayMs = Math.min(15_000, 1_000 * 2 ** Math.min(attempt, 4));
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, delayMs);
          controller.signal.addEventListener("abort", () => {
            clearTimeout(timer);
            resolve();
          });
        });
      }
    };

    void run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled]);

  return status;
};
