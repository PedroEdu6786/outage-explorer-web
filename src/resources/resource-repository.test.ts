import { guardOperation } from "../session/guard-operation";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OperationResult } from "../contracts/failures";
import type { ResourceIdentity, ResourcePolicy } from "../contracts/resources";
import { createSessionRuntime, type SessionRuntime } from "../session/session-runtime";
import { createResourceRepository, disabledResourcePolicy } from "./resource-repository";

const policy: ResourcePolicy = { retention: "enabled", maximumEntries: 4, maximumBytes: 4096, decide: () => "reuse" };
const identity: ResourceIdentity = { kind: "catalog", requestKey: "catalog" };
const runtimes: SessionRuntime[] = [];
afterEach(() => { runtimes.splice(0).forEach((runtime) => { runtime.dispose(); }); });
function setup(selectedPolicy = policy) {
  const runtime = createSessionRuntime(); runtimes.push(runtime);
  const resolution = { status: "authenticated" as const, session: { identity: { subject: "one", displayName: "One" }, capabilities: { datasetIds: ["national"], canReadNationalSeries: true, canExploreDatasets: false, canExecuteQuery: false, canRefreshDatasets: false }, expiresAt: new Date(Date.now() + 3600_000).toISOString() } };
  runtime.setResolution(resolution);
  return { runtime, resolution, resources: createResourceRepository({ runtime, policy: selectedPolicy }) };
}
function deferred<T>() { let release: (value: T) => void = () => { throw new Error("Deferred resolver not assigned"); }; const promise = new Promise<T>((resolve) => { release = resolve; }); return { promise, release }; }
const success = <T,>(value: T): OperationResult<T> => ({ ok: true, value });

describe("protected catalog memory", () => {
  it("shares pending reads, detaches an aborted reader, and permits a remounted reader", async () => {
    const { runtime, resources } = setup(); const delayed = deferred<OperationResult<readonly string[]>>();
    const load = vi.fn(() => delayed.promise); const abort = new AbortController();
    const first = resources.read({ context: runtime.capture(abort.signal), identity, load });
    const remaining = resources.read({ context: runtime.capture(), identity, load });
    await Promise.resolve(); abort.abort();
    expect(await first).toMatchObject({ ok: false });
    const remount = resources.read({ context: runtime.capture(), identity, load });
    expect(load).toHaveBeenCalledTimes(1);
    expect(load.mock.calls).toHaveLength(1);
    delayed.release(success(["national", "opaque/+?"]));
    expect(await remaining).toEqual(success(["national", "opaque/+?"]));
    expect(await remount).toEqual(await remaining);
    expect(await resources.read({ context: runtime.capture(), identity, load })).toEqual(await remaining);
    expect(load).toHaveBeenCalledTimes(1);
  });
  it("preserves empty successes but never retains failures or rejected loaders", async () => {
    const { runtime, resources } = setup();
    const load = vi.fn().mockResolvedValueOnce({ ok: false, failure: { kind: "service-failure", message: "Failure" } }).mockRejectedValueOnce(new Error("private")).mockResolvedValue(success([]));
    const read = () => resources.read({ context: runtime.capture(), identity, load });
    expect((await read()).ok).toBe(false); expect((await read()).ok).toBe(false);
    expect(await read()).toEqual(success([])); expect(await read()).toEqual(success([]));
    expect(load).toHaveBeenCalledTimes(3);
  });
  it.each(["cleanup", "disposal", "published-refresh"] as const)("blocks late success after %s, even when transport ignores abort", async (reason) => {
    const { runtime, resources } = setup(); const delayed = deferred<OperationResult<string>>();
    const load = vi.fn(() => delayed.promise);
    const old = resources.read({ context: runtime.capture(), identity, load }); await Promise.resolve();
    if (reason === "cleanup") runtime.invalidate(); else if (reason === "disposal") resources.dispose(); else resources.invalidate({ reason });
    expect(resources.accounting()).toEqual({ entries: 0, bytes: 0, pending: 0 });
    expect((await old).ok).toBe(false);
    delayed.release(success("obsolete")); await Promise.resolve(); await Promise.resolve();
    expect(resources.accounting().entries).toBe(0);
  });
  it.each(["identity", "capabilities"] as const)("clears ownership on %s replacement and rejects late old-session denial", async (change) => {
    const { runtime, resources, resolution } = setup(); const delayed = deferred<OperationResult<string>>();
    const staleContext = runtime.capture();
    const old = resources.read({ context: staleContext, identity, load: () => delayed.promise }); await Promise.resolve();
    runtime.setResolution({ ...resolution, session: { ...resolution.session, ...(change === "identity" ? { identity: { subject: "two", displayName: "Two" } } : { capabilities: { ...resolution.session.capabilities, canExploreDatasets: true } }) } });
    const load = vi.fn().mockResolvedValue(success("current"));
    expect(await resources.read({ context: runtime.capture(), identity, load })).toEqual(success("current"));
    delayed.release({ ok: false, failure: { kind: "forbidden", message: "Old denial" } }); await old;
    resources.reportFailure(staleContext, { kind: "unauthenticated", message: "Old session" });
    expect(runtime.getSnapshot().status).toBe("authenticated");
    expect(await resources.read({ context: runtime.capture(), identity, load })).toEqual(success("current"));
    expect(load).toHaveBeenCalledTimes(1);
  });
  it("current forbidden revokes all metadata and pending writers without claiming logout", async () => {
    const { runtime, resources } = setup(); const late = deferred<OperationResult<string>>();
    await resources.read({ context: runtime.capture(), identity, load: () => Promise.resolve(success("saved")) });
    const other = resources.read({ context: runtime.capture(), identity: { kind: "catalog", requestKey: "other" }, load: () => late.promise });
    await Promise.resolve();
    const denied = await resources.read({ context: runtime.capture(), identity: { kind: "catalog", requestKey: "denied" }, load: () => Promise.resolve({ ok: false, failure: { kind: "forbidden", message: "Denied" } }) });
    expect(denied.ok).toBe(false);
    expect(runtime.getSnapshot().status).toBe("access-denied");
    expect(resources.accounting()).toEqual({ entries: 0, bytes: 0, pending: 0 }); expect((await other).ok).toBe(false);
    late.release(success("late")); await Promise.resolve(); expect(resources.accounting().entries).toBe(0);
  });
  it("current unauthenticated invalidates session synchronously", async () => {
    const { runtime, resources } = setup();
    await resources.read({ context: runtime.capture(), identity, load: () => Promise.resolve({ ok: false, failure: { kind: "unauthenticated", message: "Signed out" } }) });
    expect(runtime.getSnapshot().status).toBe("unauthenticated"); expect(resources.accounting().entries).toBe(0);
  });
  it("disabled policy shares only pending work and retains no successful data", async () => {
    const { runtime, resources } = setup(disabledResourcePolicy); const load = vi.fn().mockResolvedValue(success(["national"]));
    const read = () => resources.read({ context: runtime.capture(), identity, load });
    await Promise.all([read(), read()]); await read();
    expect(load).toHaveBeenCalledTimes(2); expect(resources.accounting().entries).toBe(0);
  });
  it("honors injected entry and byte admission limits without evicting an existing bundle", async () => {
    const { runtime, resources } = setup({ retention: "enabled", maximumEntries: 1, maximumBytes: 16, decide: () => "reuse" });
    const load = vi.fn().mockResolvedValue(success("small"));
    await resources.read({ context: runtime.capture(), identity, load });
    const large = vi.fn().mockResolvedValue(success("larger than explicit byte budget"));
    const readLarge = () => resources.read({ context: runtime.capture(), identity: { kind: "catalog", requestKey: "large" }, load: large });
    await readLarge(); await readLarge(); await resources.read({ context: runtime.capture(), identity, load });
    expect(load).toHaveBeenCalledTimes(1); expect(large).toHaveBeenCalledTimes(2); expect(resources.accounting()).toMatchObject({ entries: 1, bytes: 7 });
  });
  it("injected freshness rejects an old bundle and fetches without extending metadata", async () => {
    let now = 1; const chosen: ResourcePolicy = { ...policy, retention: "enabled", maximumEntries: 4, maximumBytes: 4096, decide: (metadata, time) => metadata.fetchedAt === time ? "reuse" : "fetch" };
    const { runtime } = setup(); const resources = createResourceRepository({ runtime, policy: chosen, now: () => now });
    const load = vi.fn().mockResolvedValue(success("catalog")); await resources.read({ context: runtime.capture(), identity, load }); now = 2;
    await resources.read({ context: runtime.capture(), identity, load }); expect(load).toHaveBeenCalledTimes(2);
  });
});

it("runs mandatory invalidation subscribers and completes disposal when one throws", () => {
  const { runtime, resources } = setup(); const listener = vi.fn();
  const stop = resources.subscribe(() => { throw new Error("test subscriber"); }); resources.subscribe(listener);
  expect(() => { resources.dispose(); }).toThrow(AggregateError); expect(listener).toHaveBeenCalledTimes(1);
  stop(); expect(() => { runtime.invalidate(); }).not.toThrow();
  expect(resources.accounting()).toEqual({ entries: 0, bytes: 0, pending: 0 });
});


it.each(["denial", "published-refresh", "disposal"] as const)("%s cannot turn a guarded metadata cancellation into backend logout", async (reason) => {
  const { runtime, resources } = setup(); const late = deferred<OperationResult<string>>(); const context = runtime.capture();
  const callbacks = { onSuccess: vi.fn(), onFailure: vi.fn(), onRejected: vi.fn() };
  const guarded = guardOperation(runtime, context, () => resources.read({ context, identity, load: () => late.promise }), callbacks);
  await Promise.resolve();
  if (reason === "denial") resources.reportFailure(runtime.capture(), { kind: "forbidden", message: "Denied" });
  else if (reason === "disposal") resources.dispose(); else resources.invalidate({ reason });
  await guarded;
  expect(runtime.getSnapshot().status).toBe(reason === "denial" ? "access-denied" : "authenticated");
  if (reason === "denial") expect(callbacks.onFailure).not.toHaveBeenCalled();
  else expect(callbacks.onFailure).toHaveBeenCalledWith(expect.objectContaining({ kind: "service-failure" }));
  expect(callbacks.onSuccess).not.toHaveBeenCalled();
  late.release(success("late")); await Promise.resolve(); expect(resources.accounting().entries).toBe(0);
});


it("a guarded post-disposal read fails without claiming backend logout", async () => {
  const { runtime, resources } = setup(); resources.dispose(); const context = runtime.capture(); const load = vi.fn().mockResolvedValue(success("unused"));
  const callbacks = { onSuccess: vi.fn(), onFailure: vi.fn(), onRejected: vi.fn() };
  await guardOperation(runtime, context, () => resources.read({ context, identity, load }), callbacks);
  expect(runtime.getSnapshot().status).toBe("authenticated"); expect(load).not.toHaveBeenCalled();
  expect(callbacks.onFailure).toHaveBeenCalledWith(expect.objectContaining({ kind: "service-failure" }));
});


it("a throwing denial subscriber cannot strand catalog callers", async () => {
  const { runtime, resources } = setup();
  const stop = resources.subscribe(() => { throw new Error("Synthetic listener failure"); });
  const result = await resources.read({ context: runtime.capture(), identity, load: () => Promise.resolve({ ok: false, failure: { kind: "forbidden", message: "Denied" } }) });
  expect(result.ok).toBe(false);
  expect(resources.accounting()).toEqual({ entries: 0, bytes: 0, pending: 0 }); expect(runtime.getSnapshot().status).toBe("access-denied");
  stop();
});
