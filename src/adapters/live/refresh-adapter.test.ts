import { afterEach, describe, expect, it, vi } from "vitest";
import { createFixtureOperations } from "../../../tests/fixtures/operations";
import { createSessionRuntime } from "../../session/session-runtime";
import { createRefreshAdapter } from "./refresh-adapter";

const runtimes: ReturnType<typeof createSessionRuntime>[] = [];
afterEach(() => { runtimes.splice(0).forEach((runtime) => { runtime.dispose(); }); });
const summary = (status = "accepted") => ({ run_id: "synthetic-run", status, effective_interval: { start_date: "2026-04-02", end_date: "2026-10-01" } });
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
function setup(persona: "admin" | "analyst" | "viewer" = "admin") {
  const fixture = createFixtureOperations({ persona }); const runtime = createSessionRuntime();
  runtime.setResolution(fixture.sessionResolution()); runtimes.push(runtime);
  const fetch = vi.fn<typeof globalThis.fetch>();
  const csrfToken = vi.fn<() => string | null>(() => "synthetic-csrf");
  const operations = createRefreshAdapter({ runtime, fetch, csrfToken });
  return { runtime, fixture, fetch, csrfToken, operations };
}
describe("Admin refresh controlled transport", () => {
  it("admits an empty configured-interval request with cookies, CSRF and an unchanged idempotency key", async () => {
    const { operations, runtime, fetch } = setup();
    fetch.mockResolvedValue(json(summary(), 202));
    const key = "synthetic-request-key";
    expect(await operations.admitRefresh(runtime.capture(), key)).toMatchObject({ ok: true, value: { runId: "synthetic-run", status: "accepted" } });
    expect(fetch).toHaveBeenCalledExactlyOnceWith("/api/refresh", { method: "POST", credentials: "include", cache: "no-store", redirect: "error", headers: { "Content-Type": "application/json", "X-CSRF-Token": "synthetic-csrf", "Idempotency-Key": key }, body: "{}" });
  });
  it.each(["viewer", "analyst"] as const)("blocks %s refresh admission and status before HTTP", async (persona) => {
    const { operations, runtime, fetch } = setup(persona);
    expect(await operations.admitRefresh(runtime.capture(), "synthetic-request-key")).toMatchObject({ ok: false, failure: { kind: "forbidden" } });
    expect(await operations.readRefresh(runtime.capture())).toMatchObject({ ok: false, failure: { kind: "forbidden" } });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("requires CSRF for admission and validates keys before dispatch", async () => {
    const { operations, runtime, fetch, csrfToken } = setup();
    expect(await operations.admitRefresh(runtime.capture(), "short")).toMatchObject({ ok: false, failure: { kind: "invalid-input" } });
    csrfToken.mockReturnValue(null);
    expect(await operations.admitRefresh(runtime.capture(), "synthetic-request-key")).toMatchObject({ ok: false, failure: { kind: "unauthenticated" } });
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["accepted", "running", "succeeded", "retained", "failed", "interrupted", "publication_unknown"])("reads %s without starting another run", async (status) => {
    const { operations, runtime, fetch } = setup(); fetch.mockResolvedValue(json(summary(status)));
    expect(await operations.readRefresh(runtime.capture(), "synthetic-run")).toMatchObject({ ok: true, value: { status } });
    expect(fetch.mock.calls[0]).toEqual(["/api/refresh/synthetic-run", { method: "GET", credentials: "include", cache: "no-store", redirect: "error" }]);
  });
  it("discovers latest or no prior run and rejects mismatched or malformed runs", async () => {
    const { operations, runtime, fetch } = setup();
    fetch.mockResolvedValueOnce(json({ run: null })).mockResolvedValueOnce(json({ run: summary("running") })).mockResolvedValueOnce(json(summary())).mockResolvedValueOnce(json(summary("unknown")));
    expect(await operations.readRefresh(runtime.capture())).toEqual({ ok: true, value: null });
    expect(await operations.readRefresh(runtime.capture())).toMatchObject({ ok: true, value: { status: "running" } });
    expect(fetch.mock.calls[0]?.[0]).toBe("/api/refresh/latest");
    expect(await operations.readRefresh(runtime.capture(), "different-run")).toMatchObject({ ok: false });
    expect(await operations.readRefresh(runtime.capture())).toMatchObject({ ok: false });
  });
  it.each([401, 403, 409, 503])("handles HTTP %s with safe errors and no replay", async (status) => {
    const { operations, runtime, fetch } = setup(); fetch.mockResolvedValue(json({ private: "internal details" }, status));
    const result = await operations.admitRefresh(runtime.capture(), "synthetic-request-key");
    expect(result).toMatchObject({ ok: false }); expect(JSON.stringify(result)).not.toContain("internal details"); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("ignores late success after access reduction", async () => {
    const { operations, runtime, fixture, fetch } = setup();
    let release!: (response: Response) => void;
    fetch.mockReturnValue(new Promise((resolve) => { release = resolve; }));
    const pending = operations.admitRefresh(runtime.capture(), "synthetic-request-key");
    fixture.setPersona("viewer"); runtime.setResolution(fixture.sessionResolution()); release(json(summary("succeeded"), 202));
    expect(await pending).toMatchObject({ ok: false, failure: { kind: "unauthenticated" } });
  });
});
