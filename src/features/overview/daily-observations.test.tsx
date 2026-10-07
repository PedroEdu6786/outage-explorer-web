import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { NationalObservation } from "../../contracts/observations";
import { DailyObservations } from "./DailyObservations";

const observations: readonly NationalObservation[] = Array.from({ length: 23 }, (_, index) => ({
  status: "unavailable", date: `2026-09-${String(index + 1).padStart(2, "0")}`,
}));
const table = () => within(screen.getByRole("table", { name: "Daily national observations" }));
const navigation = () => within(screen.getByRole("navigation", { name: "Daily observations pagination" }));

describe("Daily observations pagination", () => {
  it("starts with ten rows and browses forward/back including the final short page", () => {
    render(<DailyObservations observations={observations} />);
    expect(screen.getByLabelText("Rows per page")).toHaveValue("10");
    expect(table().getAllByRole("row")).toHaveLength(11);
    expect(navigation().getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(table().queryByText("2026-09-11")).toBeNull();
    fireEvent.click(navigation().getByRole("button", { name: "Next" }));
    expect(table().getByText("2026-09-11")).toBeVisible();
    expect(table().queryByText("2026-09-01")).toBeNull();
    fireEvent.click(navigation().getByRole("button", { name: "Next" }));
    expect(table().getAllByRole("row")).toHaveLength(4);
    expect(screen.getByText("Page 3 of 3 · 21–23 of 23 observations")).toBeVisible();
    expect(navigation().getByRole("button", { name: "Next" })).toBeDisabled();
    fireEvent.click(navigation().getByRole("button", { name: "Previous" }));
    expect(table().getByText("2026-09-11")).toBeVisible();
  });
  it("resets to the first page when size or observations change", () => {
    const view = render(<DailyObservations observations={observations} />);
    fireEvent.click(navigation().getByRole("button", { name: "Next" }));
    fireEvent.change(screen.getByLabelText("Rows per page"), { target: { value: "20" } });
    expect(table().getAllByRole("row")).toHaveLength(21);
    expect(navigation().getByRole("button", { name: "Previous" })).toBeDisabled();
    fireEvent.click(navigation().getByRole("button", { name: "Next" }));
    view.rerender(<DailyObservations observations={observations.slice(0, 21)} />);
    expect(table().getByText("2026-09-01")).toBeVisible();
    expect(navigation().getByRole("button", { name: "Previous" })).toBeDisabled();
  });
  it("disables page actions and size changes while retained observations are loading", () => {
    render(<DailyObservations observations={observations} loading />);
    expect(screen.getByLabelText("Rows per page")).toBeDisabled();
    for (const button of navigation().getAllByRole("button")) expect(button).toBeDisabled();
    expect(screen.queryByRole("table")).toBeNull();
  });
  it("handles empty observations without an invalid page or active navigation", () => {
    render(<DailyObservations observations={[]} />);
    expect(screen.getByText("Page 1 of 1 · 0 of 0 observations")).toBeVisible();
    for (const button of navigation().getAllByRole("button")) expect(button).toBeDisabled();
  });
});
