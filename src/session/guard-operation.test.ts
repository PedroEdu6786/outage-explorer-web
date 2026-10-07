import { describe, expect, it, vi } from "vitest";
import type { OperationResult } from "../contracts/failures";
import { createFixtureOperations } from "../../tests/fixtures/operations";
import { createSessionRuntime } from "./session-runtime";
import { guardCurrent, guardOperation } from "./guard-operation";

function setup() {
  const controller = createFixtureOperations();
  const runtime = createSessionRuntime();
  runtime.setResolution(controller.sessionResolution());
  const callbacks = { onSuccess: vi.fn(), onFailure: vi.fn(), onRejected: vi.fn() };
  return { controller, runtime, callbacks };
}

describe("guarded operation publication", () => {
  it.each(["listDatasets", "readSchema"] as const)("discards late %s metadata across Analyst logout to Viewer", async (operation) => {
    const { controller, runtime, callbacks } = setup();
    const delayed = controller.deferNext(operation);
    const context = runtime.capture();
    const produce = operation === "listDatasets" ? () => controller.operations.listDatasets(context) : () => controller.operations.readSchema(context, "synthetic-facility");
    const result = guardOperation<unknown>(runtime, context, produce, callbacks);
    runtime.invalidate();
    controller.setPersona("viewer");
    runtime.setResolution(controller.sessionResolution());
    delayed.release();
    await expect(result).resolves.toBe("discarded");
    expect(callbacks.onSuccess).not.toHaveBeenCalled();
    expect(runtime.getSnapshot().status).toBe("authenticated");
    runtime.dispose();
  });

  it.each(["unauthenticated", "forbidden"] as const)("ignores delayed %s failure after access reduction", async (kind) => {
    const { controller, runtime, callbacks } = setup();
    controller.failNext("readSchema", { kind, message: "Synthetic old-session error" });
    const delayed = controller.deferNext("readSchema");
    const context = runtime.capture();
    const result = guardOperation(runtime, context, () => controller.operations.readSchema(context, "synthetic-facility"), callbacks);
    controller.setPersona("viewer");
    runtime.setResolution(controller.sessionResolution());
    delayed.release();
    await expect(result).resolves.toBe("discarded");
    expect(callbacks.onFailure).not.toHaveBeenCalled();
    expect(runtime.getSnapshot().status).toBe("authenticated");
    runtime.dispose();
  });

  it("discards late transport rejection without affecting the next session", async () => {
    const { controller, runtime, callbacks } = setup();
    const delayed = controller.deferNext("listDatasets");
    const context = runtime.capture();
    const result = guardOperation(runtime, context, () => controller.operations.listDatasets(context), callbacks);
    controller.setPersona("viewer");
    runtime.setResolution(controller.sessionResolution());
    delayed.reject(new Error("old network failure"));
    await expect(result).resolves.toBe("discarded");
    expect(callbacks.onRejected).not.toHaveBeenCalled();
    runtime.dispose();
  });

  it("blocks protected dispatch while pending but allows guarded session resolution", async () => {
    const runtime = createSessionRuntime();
    const operation = vi.fn(() => Promise.resolve({ ok: true as const, value: undefined }));
    const callbacks = { onSuccess: vi.fn(), onFailure: vi.fn(), onRejected: vi.fn() };
    await expect(guardOperation(runtime, runtime.capture(), operation, callbacks)).resolves.toBe("discarded");
    expect(operation).not.toHaveBeenCalled();
    await expect(guardOperation(runtime, runtime.capture(), operation, { ...callbacks, requireAuthenticated: false })).resolves.toBe("published");
    expect(operation).toHaveBeenCalledOnce();
  });

  it("invalidates current unauthenticated failure even when its callback throws", async () => {
    const { runtime, callbacks } = setup();
    const onFailure = () => { throw new Error("feature callback failed"); };
    const operation = () => Promise.resolve<OperationResult<void>>({ ok: false, failure: { kind: "unauthenticated", message: "Synthetic" } });
    await expect(guardOperation(runtime, runtime.capture(), operation, { ...callbacks, onFailure })).rejects.toThrow("callback failed");
    expect(runtime.getSnapshot().status).toBe("unauthenticated");
    runtime.dispose();
  });

  it.each(["unauthenticated", "forbidden"] as const)("cannot invalidate a new generation established by a throwing %s callback", async (kind) => {
    const { controller, runtime, callbacks } = setup();
    const operation = () => Promise.resolve<OperationResult<void>>({ ok: false, failure: { kind, message: "Synthetic" } });
    const onFailure = () => {
      controller.setPersona("viewer");
      runtime.setResolution(controller.sessionResolution());
      throw new Error("callback failed");
    };
    await expect(guardOperation(runtime, runtime.capture(), operation, { ...callbacks, onFailure })).rejects.toThrow("callback failed");
    expect(runtime.getSnapshot().status).toBe("authenticated");
    runtime.dispose();
  });

  it("guards pending intents and synchronous side effects after logout", () => {
    const { runtime } = setup();
    const context = runtime.capture();
    const publish = vi.fn();
    runtime.invalidate();
    expect(guardCurrent(runtime, context, publish)).toBe(false);
    expect(publish).not.toHaveBeenCalled();
  });

  it("revokes access even when feature denial cleanup aborts the request and throws", async () => {
    const { runtime, callbacks } = setup();
    const abort = new AbortController();
    const context = runtime.capture(abort.signal);
    const cleanup = vi.fn();
    runtime.registerCleanup(cleanup);
    const operation = () => Promise.resolve<OperationResult<void>>({ ok: false, failure: { kind: "forbidden", message: "Denied" } });
    await expect(guardOperation(runtime, context, operation, {
      ...callbacks,
      onFailure: () => { abort.abort(); throw new Error("Feature cleanup failed"); },
    })).rejects.toThrow("Feature cleanup failed");
    expect(runtime.getSnapshot().status).toBe("access-denied");
    expect(cleanup).toHaveBeenCalledOnce();
    expect(runtime.isCurrent(context)).toBe(false);
    runtime.dispose();
  });

  it("publishes current execution uncertainty once without retry", async () => {
    const { controller, runtime, callbacks } = setup();
    controller.failNextExecution({ kind: "unknown-execution-outcome", message: "Synthetic response lost" });
    const context = runtime.capture();
    await expect(guardOperation(runtime, context, () => controller.operations.executeQuery(context, { sql: "SELECT synthetic", page: 1, pageSize: 2 }), callbacks)).resolves.toBe("published");
    expect(callbacks.onFailure).toHaveBeenCalledWith(expect.objectContaining({ kind: "unknown-execution-outcome" }));
    expect(controller.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(1);
    runtime.dispose();
  });
});
