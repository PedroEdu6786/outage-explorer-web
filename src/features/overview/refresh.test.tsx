import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { createFixtureOperations } from "../../../tests/fixtures/operations";
import { SessionProvider } from "../../session/SessionProvider";
import { createSessionRuntime } from "../../session/session-runtime";
import type { RefreshOperations, RefreshSummary } from "../../contracts/refresh";
import { RefreshControl } from "./RefreshControl";

const runtimes: ReturnType<typeof createSessionRuntime>[] = [];
afterEach(() => { runtimes.splice(0).forEach((runtime) => { runtime.dispose(); }); });
const run = (status: RefreshSummary["status"]): RefreshSummary => ({ runId: "synthetic-run", status, interval: { start: "2026-04-02", end: "2026-10-01" } });
function setup(persona: "admin" | "analyst" | "viewer" = "admin") {
  const fixture = createFixtureOperations({ persona }); const runtime = createSessionRuntime(); runtime.setResolution(fixture.sessionResolution()); runtimes.push(runtime);
  const operations = { admitRefresh: vi.fn<RefreshOperations["admitRefresh"]>(), readRefresh: vi.fn<RefreshOperations["readRefresh"]>() };
  const onPublished = vi.fn();
  render(<SessionProvider runtime={runtime}><RefreshControl operations={operations} onPublished={onPublished} /></SessionProvider>);
  return { fixture, runtime, operations, onPublished };
}
it.each(["viewer", "analyst"] as const)("does not expose refresh controls or make requests for %s", (persona) => {
  const { operations } = setup(persona);
  expect(screen.queryByRole("button", { name: "Refresh data" })).toBeNull();
  expect(operations.admitRefresh).not.toHaveBeenCalled(); expect(operations.readRefresh).not.toHaveBeenCalled();
});
it("keeps admission explicit, disables double clicks and checks status without rerunning", async () => {
  const { operations, onPublished } = setup(); operations.admitRefresh.mockResolvedValue({ ok: true, value: run("accepted") });
  expect(operations.admitRefresh).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Refresh data" }));
  fireEvent.click(screen.getByRole("button", { name: "Refresh data" }));
  await screen.findByText(/Refresh accepted/); expect(operations.admitRefresh).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Refresh data" })).toBeDisabled();
  operations.readRefresh.mockResolvedValueOnce({ ok: true, value: run("publication_unknown") });
  fireEvent.click(screen.getByRole("button", { name: "Check refresh status" })); await screen.findByText(/Publication outcome is not yet confirmed/);
  expect(operations.readRefresh.mock.calls[0]?.[1]).toBe("synthetic-run");
  expect(screen.getByRole("button", { name: "Refresh data" })).toBeDisabled(); expect(onPublished).not.toHaveBeenCalled();
  operations.readRefresh.mockResolvedValue({ ok: true, value: run("succeeded") });
  fireEvent.click(screen.getByRole("button", { name: "Check refresh status" })); await screen.findByText(/new data was published/);
  expect(onPublished).toHaveBeenCalledTimes(1);
  await waitFor(() => { expect(screen.getByRole("button", { name: "Refresh data" })).toBeEnabled(); });
  fireEvent.click(screen.getByRole("button", { name: "Check refresh status" })); await waitFor(() => { expect(operations.readRefresh).toHaveBeenCalledTimes(3); });
  expect(onPublished).toHaveBeenCalledTimes(1); expect(operations.admitRefresh).toHaveBeenCalledTimes(1);
});
it("preserves the idempotency key across an uncertain admission retry", async () => {
  const { operations } = setup();
  operations.admitRefresh.mockResolvedValueOnce({ ok: false, failure: { kind: "service-failure", message: "Admission uncertain" } }).mockResolvedValueOnce({ ok: true, value: run("accepted") });
  fireEvent.click(screen.getByRole("button", { name: "Refresh data" })); await screen.findByText("Admission uncertain");
  fireEvent.click(screen.getByRole("button", { name: "Retry refresh admission" })); await screen.findByText(/Refresh accepted/);
  expect(operations.admitRefresh.mock.calls[0]?.[1]).toBe(operations.admitRefresh.mock.calls[1]?.[1]);
});
it.each(["previous", "running", "publication_unknown", "succeeded", "none", "unavailable"] as const)("preserves a new uncertain admission across a %s status lookup", async (lookup) => {
  const { operations } = setup();
  const previousRun = { ...run("succeeded"), runId: "previous-run" };
  const newRun = { ...run("succeeded"), runId: "new-run" };
  operations.admitRefresh
    .mockResolvedValueOnce({ ok: true, value: previousRun })
    .mockResolvedValueOnce({ ok: false, failure: { kind: "service-failure", message: "New admission uncertain" } })
    .mockResolvedValueOnce({ ok: true, value: newRun })
    .mockResolvedValueOnce({ ok: true, value: { ...run("accepted"), runId: "following-run" } });
  fireEvent.click(screen.getByRole("button", { name: "Refresh data" }));
  await screen.findByText(/new data was published/);
  fireEvent.click(screen.getByRole("button", { name: "Refresh data" }));
  await screen.findByText("New admission uncertain");
  expect(screen.queryByText(/new data was published/)).toBeNull();
  expect(screen.getByRole("button", { name: "Retry refresh admission" })).toBeEnabled();

  if (lookup === "unavailable") {
    operations.readRefresh.mockResolvedValue({ ok: false, failure: { kind: "service-failure", message: "Status unavailable" } });
  } else {
    const latest = lookup === "none" ? null : lookup === "previous" ? previousRun : { ...run(lookup), runId: "another-admin-run" };
    operations.readRefresh.mockResolvedValue({ ok: true, value: latest });
  }
  fireEvent.click(screen.getByRole("button", { name: "Check refresh status" }));
  await waitFor(() => { expect(screen.getByRole("button", { name: "Retry refresh admission" })).toBeEnabled(); });
  expect(operations.readRefresh).toHaveBeenCalledTimes(1);
  expect(operations.readRefresh.mock.calls[0]?.[1]).toBeUndefined();
  expect(operations.admitRefresh).toHaveBeenCalledTimes(2);

  fireEvent.click(screen.getByRole("button", { name: "Retry refresh admission" }));
  await waitFor(() => { expect(screen.getByRole("button", { name: "Refresh data" })).toBeEnabled(); });
  const previousKey = operations.admitRefresh.mock.calls[0]?.[1];
  const uncertainKey = operations.admitRefresh.mock.calls[1]?.[1];
  expect(uncertainKey).toEqual(expect.any(String));
  expect(uncertainKey).not.toBe(previousKey);
  expect(operations.admitRefresh.mock.calls[2]?.[1]).toBe(uncertainKey);
  fireEvent.click(screen.getByRole("button", { name: "Refresh data" }));
  await screen.findByText(/Refresh accepted/);
  expect(operations.admitRefresh.mock.calls[3]?.[1]).not.toBe(uncertainKey);
});

it("discards an uncertain admission key when the authoritative session changes", async () => {
  const { fixture, runtime, operations } = setup();
  operations.admitRefresh.mockResolvedValueOnce({ ok: false, failure: { kind: "service-failure", message: "Admission uncertain" } });
  fireEvent.click(screen.getByRole("button", { name: "Refresh data" }));
  await screen.findByText("Admission uncertain");
  const oldKey = operations.admitRefresh.mock.calls[0]?.[1];
  act(() => { fixture.setPersona("viewer"); runtime.setResolution(fixture.sessionResolution()); });
  expect(screen.queryByRole("button", { name: "Retry refresh admission" })).toBeNull();
  act(() => { fixture.setPersona("admin"); runtime.setResolution(fixture.sessionResolution()); });
  operations.admitRefresh.mockResolvedValueOnce({ ok: true, value: run("accepted") });
  fireEvent.click(screen.getByRole("button", { name: "Refresh data" }));
  await screen.findByText(/Refresh accepted/);
  expect(operations.admitRefresh.mock.calls[1]?.[1]).not.toBe(oldKey);
});
it("clears protected run state and ignores late responses when Admin becomes Viewer", async () => {
  const { fixture, runtime, operations, onPublished } = setup();
  let release!: (value: Awaited<ReturnType<RefreshOperations["admitRefresh"]>>) => void;
  operations.admitRefresh.mockReturnValue(new Promise((resolve) => { release = resolve; }));
  fireEvent.click(screen.getByRole("button", { name: "Refresh data" }));
  act(() => { fixture.setPersona("viewer"); runtime.setResolution(fixture.sessionResolution()); });
  await act(async () => { release({ ok: true, value: run("succeeded") }); await Promise.resolve(); });
  expect(screen.queryByRole("region", { name: "Admin data refresh" })).toBeNull(); expect(onPublished).not.toHaveBeenCalled();
});
it("revokes controls on forbidden status without automatic retries", async () => {
  const { runtime, operations } = setup(); operations.readRefresh.mockResolvedValue({ ok: false, failure: { kind: "forbidden", message: "Refresh access denied" } });
  fireEvent.click(screen.getByRole("button", { name: "Check refresh status" }));
  await waitFor(() => { expect(runtime.getSnapshot().status).toBe("access-denied"); });
  expect(screen.queryByRole("button", { name: "Refresh data" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Check refresh status" })).toBeNull(); expect(operations.readRefresh).toHaveBeenCalledTimes(1);
});

it("keeps one persistent live region through refresh states and settles on publication", async () => {
  const { operations } = setup();
  operations.admitRefresh.mockResolvedValue({ ok: true, value: run("accepted") });
  fireEvent.click(screen.getByRole("button", { name: "Refresh data" }));
  await screen.findByText(/Refresh accepted/);
  const region = screen.getByRole("status");
  expect(region).toHaveAttribute("aria-atomic", "true");
  for (const state of ["running", "succeeded"] as const) {
    operations.readRefresh.mockResolvedValue({ ok: true, value: run(state) });
    fireEvent.click(screen.getByRole("button", { name: "Check refresh status" }));
    await waitFor(() => { expect(region).toHaveTextContent(state === "running" ? "Refresh is running" : "new data was published"); });
    expect(screen.getAllByRole("status")).toEqual([region]);
  }
  expect(region.parentElement).toHaveClass("motion-enter-settle");
});
