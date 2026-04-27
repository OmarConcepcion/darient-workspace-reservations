import { render, screen } from "@testing-library/react";
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
    expect(screen.getByText("Operations console")).toBeInTheDocument();
    expect(screen.getByTitle(/IoT stream status/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /smart workspace reservations/i
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Spaces" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Reservations" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Admin" })).toBeInTheDocument();
  });
});
