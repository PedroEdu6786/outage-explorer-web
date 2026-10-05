import { afterEach, describe, expect, it, vi } from "vitest";
import type { SessionResolution } from "../contracts/session";
import { createSessionRuntime } from "./session-runtime";

const session = (datasets: readonly string[] = ["national", "facility"], lifetime = 1000): SessionResolution => ({
  status: "authenticated",
  session: { identity: { subject: "test-subject", displayName: "Test" }, capabilities: { datasetIds: datasets, canReadNationalSeries: true, canExecuteQuery: true }, expiresAt: new Date(Date.now() + lifetime).toISOString() },
});

afterEach(() => { vi.useRealTimers(); });

describe("session invalidation", () => {
  it("starts pending and clears protected caches before notifying subscribers", () => {
    const runtime = createSessionRuntime();
    const protectedRows = ["facility"];
    expect(runtime.getSnapshot().status).toBe("pending");
    runtime.registerCleanup(() => { protectedRows.length = 0; });
    const subscriber = vi.fn(() => { expect(protectedRows).toEqual([]); });
    runtime.subscribe(subscriber);
    runtime.setResolution(session());
    expect(subscriber).toHaveBeenCalledOnce();
    runtime.dispose();
  });

  it("invalidates captured operations after logout, new identity and access reduction", () => {
    const runtime = createSessionRuntime();
    runtime.setResolution(session());
    const analyst = runtime.capture();
    runtime.invalidate();
    runtime.setResolution(session(["national"]));
    expect(runtime.isCurrent(analyst)).toBe(false);
    const viewer = runtime.capture();
    runtime.setResolution(session([]));
    expect(runtime.isCurrent(viewer)).toBe(false);
    expect(runtime.getSnapshot().generation).toBeGreaterThan(viewer.generation);
    runtime.dispose();
  });

  it("expires without renewal and cancels the obsolete session timer", () => {
    vi.useFakeTimers();
    const runtime = createSessionRuntime();
    runtime.setResolution(session(["national"], 100));
    vi.advanceTimersByTime(50);
    runtime.setResolution(session(["national"], 1000));
    vi.advanceTimersByTime(50);
    expect(runtime.getSnapshot().status).toBe("authenticated");
    vi.advanceTimersByTime(950);
    expect(runtime.getSnapshot().status).toBe("expired");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("checks expiry before dispatch even when a scheduled callback has not fired", () => {
    let now = 0;
    const runtime = createSessionRuntime({ now: () => now, schedule: () => () => undefined });
    runtime.setResolution({ ...session(), status: "authenticated", session: { identity: { subject: "test", displayName: "Test" }, capabilities: { datasetIds: ["national"], canReadNationalSeries: true, canExecuteQuery: true }, expiresAt: new Date(100).toISOString() } });
    const context = runtime.capture();
    now = 100;
    expect(runtime.isCurrent(context)).toBe(false);
    expect(runtime.getSnapshot().status).toBe("expired");
  });

  it("still schedules expiry when cleanup and subscriber callbacks throw", () => {
    vi.useFakeTimers();
    const runtime = createSessionRuntime();
    const secondCleanup = vi.fn();
    runtime.registerCleanup(() => { throw new Error("cleanup failed"); });
    runtime.registerCleanup(secondCleanup);
    runtime.subscribe(() => { throw new Error("subscriber failed"); });
    expect(() => { runtime.setResolution(session()); }).toThrow(AggregateError);
    expect(vi.getTimerCount()).toBe(1);
    expect(() => vi.advanceTimersByTime(1000)).toThrow(AggregateError);
    expect(runtime.getSnapshot().status).toBe("expired");
    expect(secondCleanup).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("fails closed for malformed or already elapsed expiry", () => {
    const runtime = createSessionRuntime();
    const resolved = session();
    if (resolved.status !== "authenticated") throw new Error("Expected test session");
    runtime.setResolution({ ...resolved, session: { ...resolved.session, expiresAt: "invalid" } });
    expect(runtime.getSnapshot().status).toBe("expired");
    runtime.setResolution(session([], -1));
    expect(runtime.getSnapshot().status).toBe("expired");
  });

  it("rejects aborted contexts and disposes even if a cleanup throws", () => {
    const runtime = createSessionRuntime();
    runtime.setResolution(session());
    const controller = new AbortController();
    const context = runtime.capture(controller.signal);
    controller.abort();
    expect(runtime.isCurrent(context)).toBe(false);
    runtime.registerCleanup(() => { throw new Error("cleanup failed"); });
    expect(() => { runtime.dispose(); }).toThrow(AggregateError);
    expect(runtime.isCurrent(runtime.capture())).toBe(false);
    expect(() => runtime.subscribe(() => undefined)).toThrow("disposed");
  });
});
