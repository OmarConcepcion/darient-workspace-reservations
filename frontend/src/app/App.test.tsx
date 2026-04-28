import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../test/server";
import { TEST_API_BASE_URL } from "../test/render";
import { App } from "./App";

const emptyEventStream = () =>
  new ReadableStream({
    start(controller) {
      controller.close();
    }
  });

describe("App", () => {
  it("renders the workspace shell", () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/admin/events/stream`, () =>
        new HttpResponse(emptyEventStream(), {
          headers: { "Content-Type": "text/event-stream" }
        })
      ),
      http.get(`${TEST_API_BASE_URL}/spaces`, () =>
        HttpResponse.json({ data: [] })
      ),
      http.get(`${TEST_API_BASE_URL}/reservations`, () =>
        HttpResponse.json({
          data: [],
          pagination: { page: 1, page_size: 3, total: 0 }
        })
      )
    );

    render(<App />);

    expect(screen.getByText("Darient Workspace Reservations")).toBeInTheDocument();
    expect(screen.getByText("Consola de operaciones")).toBeInTheDocument();
    expect(screen.getByTitle(/Estado del stream IoT/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Reservas inteligentes/i
      })
    ).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Navegación principal" });
    expect(within(nav).getByRole("link", { name: "Oficinas" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Reservas" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ayuda/i })).toHaveAttribute(
      "href",
      "/help"
    );
  });

  it("renders the help page with a Swagger link", async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/admin/events/stream`, () =>
        new HttpResponse(emptyEventStream(), {
          headers: { "Content-Type": "text/event-stream" }
        })
      )
    );

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: /ayuda/i }));

    expect(
      await screen.findByRole("heading", { name: "Ayuda" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /abrir swagger/i })).toHaveAttribute(
      "href",
      "http://localhost:3000/api/v1/docs"
    );
  });
});
