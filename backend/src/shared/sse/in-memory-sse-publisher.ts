import type { Response } from "express";

import type { SseEventName, SsePublisher } from "../../modules/iot/ports/sse-publisher.js";

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

    for (const client of this.clients.values()) {
      client.response.write(payload);
    }
  }
}
