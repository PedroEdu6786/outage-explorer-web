import { guardOperation } from "../session/guard-operation";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OperationResult } from "../contracts/failures";
import type { CatalogCachePolicy } from "../contracts/catalog-cache";
import type { CatalogBundle } from "../contracts/catalog";
import { createSessionRuntime, type SessionRuntime } from "../session/session-runtime";
import { createCatalogCache, disabledCatalogCachePolicy } from "./catalog-cache";

const policy: CatalogCachePolicy = { retention: "enabled", maximumBytes: 4096 };
const runtimes: SessionRuntime[] = [];
afterEach(() => { runtimes.splice(0).forEach((runtime) => { runtime.dispose(); }); });
function setup(selectedPolicy = policy) {
  const runtime = createSessionRuntime(); runtimes.push(runtime);
  const resolution = { status: "authenticated" as const, session: { identity: { subject: "one", displayName: "One" }, capabilities: { datasetIds: ["national"], canReadNationalSeries: true, canExploreDatasets: false, canExecuteQuery: false, canRefreshDatasets: false }, expiresAt: new Date(Date.now() + 3600_000).toISOString() } };
  runtime.setResolution(resolution);
  return { runtime, resolution, catalogCache: createCatalogCache({ runtime, policy: selectedPolicy }) };
}
function deferred<T>() { let release: (value: T) => void = () => { throw new Error("Deferred resolver not assigned"); }; const promise = new Promise<T>((resolve) => { release = resolve; }); return { promise, release }; }
const bundle = (generationId = "synthetic-catalog"): CatalogBundle => ({ generationId, datasets: [], schemas: [] });
const success = <T,>(value: T): OperationResult<T> => ({ ok: true, value });

describe("protected catalog memory", () => {
  it("shares pending reads, detaches an aborted reader, and permits a remounted reader", async () => {
    const { runtime, catalogCache } = setup(); const delayed = deferred<OperationResult<CatalogBundle>>();
    const load = vi.fn(() => delayed.promise); const abort = new AbortController();
    const first = catalogCache.read({ context: runtime.capture(abort.signal), load });
    const remaining = catalogCache.read({ context: runtime.capture(), load });
    await Promise.resolve(); abort.abort();
    expect(await first).toMatchObject({ ok: false });
    const remount = catalogCache.read({ context: runtime.capture(), load });
    expect(load).toHaveBeenCalledTimes(1);
    delayed.release(success(bundle("opaque/+?")));
    expect(await remaining).toEqual(success(bundle("opaque/+?")));
    expect(await remount).toEqual(await remaining);
    expect(await catalogCache.read({ context: runtime.capture(), load })).toEqual(await remaining);
    expect(load).toHaveBeenCalledTimes(1);
  });
  it("preserves empty successes but never retains failures or rejected loaders", async () => {
    const { runtime, catalogCache } = setup();
    const load = vi.fn().mockResolvedValueOnce({ ok: false, failure: { kind: "service-failure", message: "Failure" } }).mockRejectedValueOnce(new Error("private")).mockResolvedValue(success(bundle()));
    const read = () => catalogCache.read({ context: runtime.capture(), load });
    expect((await read()).ok).toBe(false); expect((await read()).ok).toBe(false);
    expect(await read()).toEqual(success(bundle())); expect(await read()).toEqual(success(bundle()));
    expect(load).toHaveBeenCalledTimes(3);
  });
  it.each(["cleanup", "disposal", "published-refresh"] as const)("blocks late success after %s, even when transport ignores abort", async (reason) => {
    const { runtime, catalogCache } = setup(); const delayed = deferred<OperationResult<CatalogBundle>>();
    const load = vi.fn(() => delayed.promise);
    const old = catalogCache.read({ context: runtime.capture(), load }); await Promise.resolve();
    if (reason === "cleanup") runtime.invalidate(); else if (reason === "disposal") catalogCache.dispose(); else catalogCache.invalidate({ reason });
    expect(catalogCache.accounting()).toEqual({ entries: 0, bytes: 0, pending: 0 });
    expect((await old).ok).toBe(false);
    delayed.release(success(bundle("obsolete"))); await Promise.resolve(); await Promise.resolve();
    expect(catalogCache.accounting().entries).toBe(0);
  });
  it.each(["identity", "capabilities"] as const)("clears ownership on %s replacement and rejects late old-session denial", async (change) => {
    const { runtime, catalogCache, resolution } = setup(); const delayed = deferred<OperationResult<CatalogBundle>>();
    const staleContext = runtime.capture();
    const old = catalogCache.read({ context: staleContext, load: () => delayed.promise }); await Promise.resolve();
    runtime.setResolution({ ...resolution, session: { ...resolution.session, ...(change === "identity" ? { identity: { subject: "two", displayName: "Two" } } : { capabilities: { ...resolution.session.capabilities, canExploreDatasets: true } }) } });
    const load = vi.fn().mockResolvedValue(success(bundle("current")));
    expect(await catalogCache.read({ context: runtime.capture(), load })).toEqual(success(bundle("current")));
    delayed.release({ ok: false, failure: { kind: "forbidden", message: "Old denial" } }); await old;
    catalogCache.reportFailure(staleContext, { kind: "unauthenticated", message: "Old session" });
    expect(runtime.getSnapshot().status).toBe("authenticated");
    expect(await catalogCache.read({ context: runtime.capture(), load })).toEqual(success(bundle("current")));
    expect(load).toHaveBeenCalledTimes(1);
  });
  it("current forbidden from another data request revokes retained metadata and pending writers", async () => {
    const { runtime, catalogCache, resolution } = setup();
    await catalogCache.read({ context: runtime.capture(), load: () => Promise.resolve(success(bundle("saved"))) });
    catalogCache.reportFailure(runtime.capture(), { kind: "forbidden", message: "Denied" });
    expect(catalogCache.accounting()).toEqual({ entries: 0, bytes: 0, pending: 0 });
    expect(runtime.getSnapshot().status).toBe("access-denied");
    runtime.setResolution(resolution);
    const late = deferred<OperationResult<CatalogBundle>>();
    const pending = catalogCache.read({ context: runtime.capture(), load: () => late.promise });
    await Promise.resolve();
    catalogCache.reportFailure(runtime.capture(), { kind: "forbidden", message: "Denied again" });
    expect((await pending).ok).toBe(false);
    late.release(success(bundle("late")));
    await Promise.resolve();
    expect(catalogCache.accounting()).toEqual({ entries: 0, bytes: 0, pending: 0 });
  });
  it("current unauthenticated invalidates session synchronously", async () => {
    const { runtime, catalogCache } = setup();
    await catalogCache.read({ context: runtime.capture(), load: () => Promise.resolve({ ok: false, failure: { kind: "unauthenticated", message: "Signed out" } }) });
    expect(runtime.getSnapshot().status).toBe("unauthenticated"); expect(catalogCache.accounting().entries).toBe(0);
  });
  it("a catalog denial settles all readers and revokes access", async () => {
    const { runtime, catalogCache } = setup();
    const denied = deferred<OperationResult<CatalogBundle>>();
    const load = vi.fn(() => denied.promise);
    const first = catalogCache.read({ context: runtime.capture(), load });
    const second = catalogCache.read({ context: runtime.capture(), load });
    await Promise.resolve();
    denied.release({ ok: false, failure: { kind: "forbidden", message: "Denied" } });
    expect((await first).ok).toBe(false);
    expect((await second).ok).toBe(false);
    expect(runtime.getSnapshot().status).toBe("access-denied");
    expect(catalogCache.accounting()).toEqual({ entries: 0, bytes: 0, pending: 0 });
    expect(load).toHaveBeenCalledTimes(1);
  });
  it("a synchronous loader failure does not strand the pending slot", async () => {
    const { runtime, catalogCache } = setup();
    const load = vi.fn()
      .mockImplementationOnce(() => { throw new Error("Synthetic loader failure"); })
      .mockResolvedValue(success(bundle()));
    expect((await catalogCache.read({ context: runtime.capture(), load })).ok).toBe(false);
    expect(catalogCache.accounting().pending).toBe(0);
    expect(await catalogCache.read({ context: runtime.capture(), load })).toEqual(success(bundle()));
    expect(load).toHaveBeenCalledTimes(2);
  });
  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid byte budget %s", (maximumBytes) => {
    const { runtime } = setup();
    expect(() => createCatalogCache({ runtime, policy: { retention: "enabled", maximumBytes } })).toThrow();
  });
  it("disabled policy shares only pending work and retains no successful data", async () => {
    const { runtime, catalogCache } = setup(disabledCatalogCachePolicy); const load = vi.fn().mockResolvedValue(success(bundle()));
    const read = () => catalogCache.read({ context: runtime.capture(), load });
    await Promise.all([read(), read()]); await read();
    expect(load).toHaveBeenCalledTimes(2); expect(catalogCache.accounting().entries).toBe(0);
  });
  it("uses oversized successes without retaining them and measures UTF-8 bytes", async () => {
    const value = bundle("é");
    const bytes = new TextEncoder().encode(JSON.stringify(value)).byteLength;
    const { runtime, catalogCache } = setup({ retention: "enabled", maximumBytes: bytes - 1 });
    const load = vi.fn().mockResolvedValue(success(value));
    const read = () => catalogCache.read({ context: runtime.capture(), load });
    expect(await read()).toEqual(success(value));
    expect(await read()).toEqual(success(value));
    expect(load).toHaveBeenCalledTimes(2);
    expect(catalogCache.accounting()).toEqual({ entries: 0, bytes: 0, pending: 0 });
  });
  it("retains a catalog exactly at its byte budget until explicit invalidation", async () => {
    const value = bundle("é");
    const bytes = new TextEncoder().encode(JSON.stringify(value)).byteLength;
    const { runtime, catalogCache } = setup({ retention: "enabled", maximumBytes: bytes });
    const load = vi.fn().mockResolvedValue(success(value));
    const read = () => catalogCache.read({ context: runtime.capture(), load });
    await read(); await read();
    expect(catalogCache.accounting()).toEqual({ entries: 1, bytes, pending: 0 });
    expect(load).toHaveBeenCalledTimes(1);
    catalogCache.invalidate({ reason: "published-refresh" });
    await read();
    expect(load).toHaveBeenCalledTimes(2);
  });
  it("an obsolete completion cannot remove a pending replacement", async () => {
    const { runtime, catalogCache } = setup();
    const old = deferred<OperationResult<CatalogBundle>>();
    const next = deferred<OperationResult<CatalogBundle>>();
    const first = catalogCache.read({ context: runtime.capture(), load: () => old.promise });
    await Promise.resolve();
    catalogCache.invalidate({ reason: "published-refresh" });
    expect((await first).ok).toBe(false);
    const load = vi.fn(() => next.promise);
    const second = catalogCache.read({ context: runtime.capture(), load });
    await Promise.resolve();
    old.release(success(bundle("obsolete")));
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    const third = catalogCache.read({ context: runtime.capture(), load });
    expect(load).toHaveBeenCalledTimes(1);
    next.release(success(bundle("replacement")));
    expect(await second).toEqual(success(bundle("replacement")));
    expect(await third).toEqual(await second);
    expect(await catalogCache.read({ context: runtime.capture(), load })).toEqual(await second);
  });

});

it("runs mandatory invalidation subscribers and completes disposal when one throws", () => {
  const { runtime, catalogCache } = setup(); const listener = vi.fn();
  const stop = catalogCache.subscribe(() => { throw new Error("test subscriber"); }); catalogCache.subscribe(listener);
  expect(() => { catalogCache.dispose(); }).toThrow(AggregateError); expect(listener).toHaveBeenCalledTimes(1);
  stop(); expect(() => { runtime.invalidate(); }).not.toThrow();
  expect(catalogCache.accounting()).toEqual({ entries: 0, bytes: 0, pending: 0 });
});


it.each(["denial", "published-refresh", "disposal"] as const)("%s cannot turn a guarded metadata cancellation into backend logout", async (reason) => {
  const { runtime, catalogCache } = setup(); const late = deferred<OperationResult<CatalogBundle>>(); const context = runtime.capture();
  const callbacks = { onSuccess: vi.fn(), onFailure: vi.fn(), onRejected: vi.fn() };
  const guarded = guardOperation(runtime, context, () => catalogCache.read({ context, load: () => late.promise }), callbacks);
  await Promise.resolve();
  if (reason === "denial") catalogCache.reportFailure(runtime.capture(), { kind: "forbidden", message: "Denied" });
  else if (reason === "disposal") catalogCache.dispose(); else catalogCache.invalidate({ reason });
  await guarded;
  expect(runtime.getSnapshot().status).toBe(reason === "denial" ? "access-denied" : "authenticated");
  if (reason === "denial") expect(callbacks.onFailure).not.toHaveBeenCalled();
  else expect(callbacks.onFailure).toHaveBeenCalledWith(expect.objectContaining({ kind: "service-failure" }));
  expect(callbacks.onSuccess).not.toHaveBeenCalled();
  late.release(success(bundle("late"))); await Promise.resolve(); expect(catalogCache.accounting().entries).toBe(0);
});


it("a guarded post-disposal read fails without claiming backend logout", async () => {
  const { runtime, catalogCache } = setup(); catalogCache.dispose(); const context = runtime.capture(); const load = vi.fn().mockResolvedValue(success(bundle("unused")));
  const callbacks = { onSuccess: vi.fn(), onFailure: vi.fn(), onRejected: vi.fn() };
  await guardOperation(runtime, context, () => catalogCache.read({ context, load }), callbacks);
  expect(runtime.getSnapshot().status).toBe("authenticated"); expect(load).not.toHaveBeenCalled();
  expect(callbacks.onFailure).toHaveBeenCalledWith(expect.objectContaining({ kind: "service-failure" }));
});


it("a throwing denial subscriber cannot strand catalog callers", async () => {
  const { runtime, catalogCache } = setup();
  const stop = catalogCache.subscribe(() => { throw new Error("Synthetic listener failure"); });
  const result = await catalogCache.read({ context: runtime.capture(), load: () => Promise.resolve({ ok: false, failure: { kind: "forbidden", message: "Denied" } }) });
  expect(result.ok).toBe(false);
  expect(catalogCache.accounting()).toEqual({ entries: 0, bytes: 0, pending: 0 }); expect(runtime.getSnapshot().status).toBe("access-denied");
  stop();
});
