import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ToolingSmoke } from "./ToolingSmoke";

describe("isolated RTL harness", () => {
  it("supports keyboard state transitions", async () => {
    const user = userEvent.setup();
    render(<ToolingSmoke />);
    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("Smoke count: 1");
  });

  it("starts each render with clean component state", () => {
    render(<ToolingSmoke />);
    expect(screen.getByRole("status")).toHaveTextContent("Smoke count: 0");
  });
});
