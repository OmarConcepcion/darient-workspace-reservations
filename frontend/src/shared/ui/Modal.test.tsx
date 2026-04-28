import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../test/render";
import { Button } from "./Button";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("renders content and supports close and confirm actions", async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <Modal
        isOpen
        title="Cancelar reserva"
        description="Esta acción cambia el estado de la reserva."
        onClose={onClose}
        actions={
          <>
            <Button variant="secondary" onClick={onClose}>
              Conservar reserva
            </Button>
            <Button variant="danger" onClick={onConfirm}>
              Confirmar cancelación
            </Button>
          </>
        }
      >
        <p>Confirma este cambio de reserva.</p>
      </Modal>
    );

    expect(
      screen.getByRole("dialog", { name: "Cancelar reserva" })
    ).toBeInTheDocument();
    expect(screen.getByText("Esta acción cambia el estado de la reserva.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar cancelación" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render when closed", () => {
    renderWithProviders(
      <Modal isOpen={false} title="Hidden" onClose={vi.fn()}>
        <p>Not visible</p>
      </Modal>
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
