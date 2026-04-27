import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders the workspace shell", () => {
    render(<App />);

    expect(screen.getByText("Darient Workspaces")).toBeInTheDocument();
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
