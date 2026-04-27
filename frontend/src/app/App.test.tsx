import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders the workspace shell", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Darient Workspace Reservations" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Spaces" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Reservations" })
    ).toBeInTheDocument();
  });
});
