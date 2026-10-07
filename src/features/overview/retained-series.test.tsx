import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionProvider } from "../../session/SessionProvider";
import { createSessionRuntime } from "../../session/session-runtime";
import { createFixtureOperations } from "../../../tests/fixtures/operations";
import { syntheticZoomSeries } from "../../../tests/fixtures/overview-zoom";
import type { NavigationIntent } from "../../contracts/navigation";
import { OverviewFeature } from "./OverviewFeature";
import { useOverview } from "./useOverview";

/**
 * D2 / AC5 — the guarded `retainedSeries`: the superseded range's series, shown
 * dimmed while its replacement loads. It must never outlive its session state,
 * never feed `series`, `explore()` or navigation guards, and never come back from
 * a late response. Synthetic fixture scenarios only.
 */
function setup(persona: "viewer" | "analyst" = "viewer") {
  const fixture = createFixtureOperations({ persona });
  const runtime = createSessionRuntime();
  runtime.setResolution(fixture.sessionResolution());
  return { fixture, runtime };
}

type Setup = ReturnType<typeof setup>;

/** Load the first series, then start a range change whose response is withheld. */
async function startRangeChange({ fixture, runtime }: Setup, onNavigate?: (intent: NavigationIntent) => void, prepare?: () => void) {
  const hook = renderHook(() => useOverview(fixture.operations, onNavigate), { wrapper: ({ children }) => <SessionProvider runtime={runtime}>{children}</SessionProvider> });
  await waitFor(() => { expect(hook.result.current.series).not.toBeNull(); });
  const first = hook.result.current.series;
  expect(hook.result.current.retainedSeries).toBeNull();
  prepare?.();
  const deferred = fixture.deferNext("readNationalSeries");
  act(() => { hook.result.current.changeRange({ start: "2026-09-01", end: "2026-09-03" }); });
  await waitFor(() => { expect(hook.result.current.loading).toBe(true); });
  return { hook, deferred, first };
}

async function release(deferred: { release: () => void }) {
  await act(async () => { deferred.release(); await Promise.resolve(); await Promise.resolve(); });
}

describe("Overview retainedSeries (AC5)", () => {
  it("is non-null only while the refetch loads, never feeds series, and ends with the response", async () => {
    const context = setup();
    const { hook, deferred, first } = await startRangeChange(context);
    expect(hook.result.current.retainedSeries).toBe(first);
    expect(hook.result.current.series).toBeNull();
    await release(deferred);
    await waitFor(() => { expect(hook.result.current.series?.range.end).toBe("2026-09-03"); });
    expect(hook.result.current.retainedSeries).toBeNull();
    hook.unmount(); context.runtime.dispose();
  });

  it("is null for an invalid range edit and keeps the previous series for chained edits", async () => {
    const context = setup();
    const { hook, deferred, first } = await startRangeChange(context);
    // A second edit while loading keeps remembering the series that is still on screen.
    const second = context.fixture.deferNext("readNationalSeries");
    act(() => { hook.result.current.changeRange({ start: "2026-09-02", end: "2026-09-03" }); });
    await waitFor(() => { expect(hook.result.current.loading).toBe(true); });
    expect(hook.result.current.retainedSeries).toBe(first);
    // A reversed range is not a refetch: nothing is retained.
    act(() => { hook.result.current.changeRange({ start: "2026-09-04", end: "2026-09-01" }); });
    expect(hook.result.current.retainedSeries).toBeNull();
    expect(hook.result.current.invalidRange).toBe(true);
    // A valid range afterwards must not resurrect the dropped series.
    await release(second);
    act(() => { hook.result.current.changeRange({ start: "2026-09-01", end: "2026-09-02" }); });
    await waitFor(() => { expect(hook.result.current.series?.range.end).toBe("2026-09-02"); });
    expect(hook.result.current.retainedSeries).toBeNull();
    await release(deferred);
    hook.unmount(); context.runtime.dispose();
  });

  const endings: readonly { name: string; end: (context: Setup) => void; refetches?: boolean }[] = [
    { name: "logout (invalidate)", end: ({ runtime }) => { runtime.invalidate(); } },
    { name: "expiry", end: ({ runtime }) => { runtime.invalidate("expired"); } },
    { name: "invalidate(pending)", end: ({ runtime }) => { runtime.invalidate("pending"); } },
    { name: "beginLogout", end: ({ runtime }) => { runtime.beginLogout(); } },
    { name: "a new session generation", refetches: true, end: ({ runtime, fixture }) => { runtime.setResolution(fixture.sessionResolution()); } },
    { name: "capability loss", end: ({ runtime, fixture }) => {
      const resolution = fixture.sessionResolution();
      if (resolution.status !== "authenticated") throw new Error("Synthetic authenticated setup required");
      runtime.setResolution({ ...resolution, session: { ...resolution.session, capabilities: { ...resolution.session.capabilities, canReadNationalSeries: false } } });
    } },
  ];

  for (const { name, end, refetches } of endings) {
    it(`drops the retained series in the same commit on ${name} and a late response cannot restore it`, async () => {
      const context = setup();
      const { hook, deferred } = await startRangeChange(context);
      expect(hook.result.current.retainedSeries).not.toBeNull();
      act(() => { end(context); });
      // Same commit as the session change: no waitFor between the change and the assertion.
      expect(hook.result.current.retainedSeries).toBeNull();
      expect(hook.result.current.series).toBeNull();
      await release(deferred);
      expect(hook.result.current.retainedSeries).toBeNull();
      // A new generation legitimately refetches under its own session; the late old response is still never shown as retained or current.
      if (!refetches) expect(hook.result.current.series).toBeNull();
      hook.unmount(); context.runtime.dispose();
    });
  }

  it("clears on a forbidden failure mid-refetch, and on any other failure", async () => {
    for (const kind of ["forbidden", "service-failure"] as const) {
      const context = setup();
      const { fixture } = context;
      const { hook, deferred } = await startRangeChange(context, undefined, () => { fixture.failNext("readNationalSeries", { kind, message: `Synthetic ${kind}` }); });
      expect(hook.result.current.retainedSeries).not.toBeNull();
      await release(deferred);
      if (kind === "forbidden") expect(context.runtime.getSnapshot().status).toBe("access-denied");
      else await waitFor(() => { expect(hook.result.current.failure?.kind).toBe(kind); });
      expect(hook.result.current.retainedSeries).toBeNull();
      expect(hook.result.current.series).toBeNull();
      hook.unmount(); context.runtime.dispose();
    }
  });

  it("clears on publication reloadMetadata and does not return after the reload settles", async () => {
    const context = setup();
    const { hook, deferred } = await startRangeChange(context);
    expect(hook.result.current.retainedSeries).not.toBeNull();
    act(() => { hook.result.current.reloadMetadata(); });
    expect(hook.result.current.retainedSeries).toBeNull();
    await release(deferred);
    await waitFor(() => { expect(hook.result.current.series).not.toBeNull(); });
    expect(hook.result.current.retainedSeries).toBeNull();
    hook.unmount(); context.runtime.dispose();
  });

  it("explore() and navigation never read the retained series", async () => {
    const context = setup("analyst");
    const intents: NavigationIntent[] = [];
    const { hook, deferred } = await startRangeChange(context, (intent) => { intents.push(intent); });
    expect(hook.result.current.retainedSeries).not.toBeNull();
    act(() => { hook.result.current.explore(); });
    expect(intents).toEqual([]);
    await release(deferred);
    await waitFor(() => { expect(hook.result.current.series).not.toBeNull(); });
    act(() => { hook.result.current.explore(); });
    expect(intents).toHaveLength(1);
    hook.unmount(); context.runtime.dispose();
  });
});

describe("Overview feature dimming (AC5)", () => {
  it.each(["logout", "expired", "pending", "capability"] as const)("withholds zoom inputs on retained long data and cannot revive it after %s", async (ending) => {
    const fixture = createFixtureOperations({ persona: "viewer", nationalSeries: syntheticZoomSeries() });
    const runtime = createSessionRuntime(); runtime.setResolution(fixture.sessionResolution());
    const view = render(<OverviewFeature operations={fixture.operations} runtime={runtime} />);
    await screen.findByRole("table");
    fireEvent.click(screen.getByRole("checkbox", { name: "Zoom mode" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    const oldChart = document.querySelector("svg[data-chart=national-trend]");
    const held = fixture.deferNext("readNationalSeries");
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-12-15" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply dates" }));
    await waitFor(() => { expect(document.querySelectorAll("[inert][aria-hidden=true]")).toHaveLength(3); });
    const controls = document.querySelector('[role="group"][aria-label="Chart zoom controls"]');
    expect(controls).not.toBeNull();
    for (const input of controls?.querySelectorAll("input,button") ?? []) expect(input).toBeDisabled();
    const retainedChart = document.querySelector("svg[data-chart=national-trend]");
    expect(retainedChart).not.toBeNull();
    expect(retainedChart?.closest('[role="region"]')).toHaveAttribute("tabindex", "-1");
    const wheel = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: -100, clientX: 465, clientY: 150 });
    retainedChart?.dispatchEvent(wheel); expect(wheel.defaultPrevented).toBe(false);
    const oldWheel = new WheelEvent("wheel", { cancelable: true, deltaY: -100 }); oldChart?.dispatchEvent(oldWheel);
    expect(oldWheel.defaultPrevented).toBe(false);
    act(() => {
      if (ending === "capability") {
        const resolution = fixture.sessionResolution();
        if (resolution.status !== "authenticated") throw new Error("Authenticated fixture required");
        runtime.setResolution({ ...resolution, session: { ...resolution.session, capabilities: { ...resolution.session.capabilities, canReadNationalSeries: false } } });
      } else runtime.invalidate(ending === "logout" ? undefined : ending);
    });
    expect(document.querySelector("svg[data-chart=national-trend]")).toBeNull();
    expect(screen.queryByText(/^Visible dates:/)).toBeNull();
    await release(held);
    expect(document.querySelector("svg[data-chart=national-trend]")).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
    expect(document.querySelector("[inert]")).toBeNull();
    view.unmount(); runtime.dispose();
  });

  async function dimmed(context: Setup) {
    const view = render(<OverviewFeature operations={context.fixture.operations} runtime={context.runtime} />);
    await screen.findByRole("table", { name: "Daily national observations" });
    const deferred = context.fixture.deferNext("readNationalSeries");
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-09-03" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply dates" }));
    await waitFor(() => { expect(document.querySelectorAll("[inert][aria-hidden=true]").length).toBe(3); });
    return { view, deferred };
  }

  it("renders dimmed inert hidden content with no actions, removes it on logout in the same commit and ignores a late response", async () => {
    const context = setup("analyst");
    const { view, deferred } = await dimmed(context);
    expect(screen.queryByRole("button", { name: "Explore dataset" })).not.toBeInTheDocument();
    expect(document.querySelector("svg[data-chart=national-trend]")).not.toBeNull();
    act(() => { context.runtime.invalidate(); });
    expect(document.querySelector("[inert]")).toBeNull();
    expect(document.querySelector("svg[data-chart=national-trend]")).toBeNull();
    expect(screen.queryByText("Fleet capacity offline")).not.toBeInTheDocument();
    expect(screen.getByText("Sign in to view national observations")).toBeVisible();
    await release(deferred);
    expect(document.querySelector("[inert]")).toBeNull();
    expect(screen.queryByText("Fleet capacity offline")).not.toBeInTheDocument();
    view.unmount(); context.runtime.dispose();
  });

  it("removes the dim on capability loss, and leaves no dim after the new range lands", async () => {
    const context = setup();
    const { view, deferred } = await dimmed(context);
    const resolution = context.fixture.sessionResolution();
    if (resolution.status !== "authenticated") throw new Error("Synthetic authenticated setup required");
    act(() => { context.runtime.setResolution({ ...resolution, session: { ...resolution.session, capabilities: { ...resolution.session.capabilities, canReadNationalSeries: false } } }); });
    expect(document.querySelector("[inert]")).toBeNull();
    expect(screen.getByText("National data access denied")).toBeVisible();
    await release(deferred);
    expect(document.querySelector("[inert]")).toBeNull();
    view.unmount(); context.runtime.dispose();
  });

  it("keeps no dimmed content after the refetch resolves", async () => {
    const context = setup();
    const { view, deferred } = await dimmed(context);
    await release(deferred);
    await waitFor(() => { expect(document.querySelector("[inert]")).toBeNull(); });
    expect(await screen.findByRole("table", { name: "Daily national observations" })).toBeVisible();
    expect(document.querySelectorAll("[aria-hidden=true][class*='opacity-']")).toHaveLength(0);
    view.unmount(); context.runtime.dispose();
  });
});
