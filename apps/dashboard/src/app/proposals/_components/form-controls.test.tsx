// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmRemovalForm } from "./form-controls";
describe("proposal form controls", () => {
  it("asks for confirmation before removing", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <ConfirmRemovalForm action={vi.fn()}>
        <button type="submit">Remover</button>
      </ConfirmRemovalForm>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Remover" }));
    expect(confirm).toHaveBeenCalledOnce();
  });
});
