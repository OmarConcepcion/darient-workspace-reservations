import type { Response } from "express";

import type { SseEventName, SsePublisher } from "../../modules/iot/ports/sse-publisher.js";
import { logger } from "../logger/logger.js";

type Client = {
  id: string;
  response: Response;
};

export class InMemorySsePublisher implements SsePublisher {
  private clients = new Map<string, Client>();

  public addClient(id: string, response: Response): void {
    this.clients.set(id, { id, response });
  }

  public removeClient(id: string): void {
    this.clients.delete(id);
  }

  public publish(event: SseEventName, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const disconnectedClientIds: string[] = [];

    for (const client of this.clients.values()) {
      if (client.response.destroyed || client.response.writableEnded) {
        disconnectedClientIds.push(client.id);
        continue;
      }

      try {
        client.response.write(payload);
      } catch (error) {
        disconnectedClientIds.push(client.id);
        logger.warn(
          {
            clientId: client.id,
            event,
            error: error instanceof Error ? error.message : "Failed SSE write"
          },
          "failed to publish sse event"
        );
      }
    }

    for (const clientId of disconnectedClientIds) {
      this.removeClient(clientId);
    }
  }
}
