import type { CatalogBundle } from "../contracts/catalog";
import type { CatalogCache, CatalogCachePolicy, CatalogInvalidation, CatalogRead } from "../contracts/catalog-cache";
import type { OperationResult } from "../contracts/failures";
import type { OperationContext } from "../contracts/session";
import type { SessionRuntime } from "../session/session-runtime";

export const catalogCachePolicy: CatalogCachePolicy = { retention: "enabled", maximumBytes: 256 * 1024 };
export const disabledCatalogCachePolicy: CatalogCachePolicy = { retention: "disabled" };

interface RetainedCatalog {
  readonly bundle: CatalogBundle;
  readonly sessionGeneration: number;
  readonly bytes: number;
}

interface PendingCatalog {
  readonly abort: AbortController;
  readonly context: OperationContext;
  readonly version: number;
  readonly promise: Promise<OperationResult<CatalogBundle>>;
}

/** One authorized catalog shared by listing, schema and national metadata reads. */
export function createCatalogCache(options: {
  readonly runtime: SessionRuntime;
  readonly policy: CatalogCachePolicy;
  readonly attachOnCreate?: boolean;
}): CatalogCache {
  const { runtime, policy } = options;
  if (policy.retention === "enabled" && (!Number.isSafeInteger(policy.maximumBytes) || policy.maximumBytes <= 0)) {
    throw new Error("An explicit positive catalog byte budget is required");
  }

  let retained: RetainedCatalog | null = null;
  let pending: PendingCatalog | null = null;
  let version = 0;
  let disposed = false;
  let unregister: (() => void) | undefined;
  const listeners = new Set<(event: CatalogInvalidation) => void>();

  function isReadable(context: OperationContext): boolean {
    return !disposed && runtime.isCurrent(context) && runtime.getSnapshot().status === "authenticated";
  }

  function unavailable(context: OperationContext): OperationResult<never> {
    if (runtime.isCurrent(context) && runtime.getSnapshot().status === "authenticated") {
      return { ok: false, failure: { kind: "service-failure", message: "This metadata read was invalidated. Try again deliberately." } };
    }
    return { ok: false, failure: { kind: "unauthenticated", message: "Session or resource context changed." } };
  }

  function invalidate(event: CatalogInvalidation): void {
    // Invalidate writers before aborting transport or notifying subscribers.
    version += 1;
    retained = null;
    const previous = pending;
    pending = null;
    previous?.abort.abort();

    const errors: unknown[] = [];
    for (const listener of [...listeners]) {
      try {
        listener(event);
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length) throw new AggregateError(errors, "Catalog invalidation listeners failed");
  }

  async function loadCatalog(input: CatalogRead, context: OperationContext, requestVersion: number, abort: AbortController): Promise<OperationResult<CatalogBundle>> {
    const isCurrent = () => requestVersion === version && isReadable(context);
    try {
      // Install the pending slot before invoking even a synchronously throwing loader.
      await Promise.resolve();
      if (!isCurrent()) return unavailable(input.context);
      const result = await input.load(context);
      if (!isCurrent()) return unavailable(input.context);
      if (!result.ok) {
        cache.reportFailure(context, result.failure);
        return result;
      }
      if (policy.retention === "enabled") {
        const bytes = new TextEncoder().encode(JSON.stringify(result.value)).byteLength;
        if (bytes <= policy.maximumBytes) {
          retained = { bundle: result.value, sessionGeneration: context.generation, bytes };
        }
      }
      return result;
    } catch {
      return { ok: false, failure: { kind: "service-failure", message: "The catalog could not be read. Try again deliberately." } };
    } finally {
      // An obsolete completion must not clear a replacement request.
      if (pending?.abort === abort) pending = null;
    }
  }

  function waitForCatalog(input: CatalogRead, work: PendingCatalog): Promise<OperationResult<CatalogBundle>> {
    return new Promise((resolve) => {
      const signal = input.context.signal;
      const detach = () => {
        signal?.removeEventListener("abort", cancelReader);
        work.abort.signal.removeEventListener("abort", cancelReader);
      };
      const cancelReader = () => {
        detach();
        resolve(unavailable(input.context));
      };
      signal?.addEventListener("abort", cancelReader, { once: true });
      work.abort.signal.addEventListener("abort", cancelReader, { once: true });
      if (signal?.aborted || work.abort.signal.aborted) {
        cancelReader();
        return;
      }
      void work.promise.then((result) => {
        detach();
        const current = work.version === version && isReadable(input.context)
          && work.context.generation === input.context.generation;
        resolve(current ? result : unavailable(input.context));
      }).catch(() => {
        detach();
        resolve({ ok: false, failure: { kind: "service-failure", message: "The metadata read could not complete. Try again deliberately." } });
      });
    });
  }

  const cache: CatalogCache = {
    policy,
    async read(input) {
      if (!isReadable(input.context)) return unavailable(input.context);
      // SessionRuntime advances generation on every identity/capability resolution.
      if (retained?.sessionGeneration === input.context.generation) return { ok: true, value: retained.bundle };
      if (pending && pending.context.generation !== input.context.generation) invalidate({ reason: "cleanup" });
      if (!pending) {
        retained = null;
        const abort = new AbortController();
        const context: OperationContext = { generation: input.context.generation, signal: abort.signal };
        pending = { abort, context, version, promise: loadCatalog(input, context, version, abort) };
      }
      return waitForCatalog(input, pending);
    },
    invalidate,
    reportFailure(context, failure) {
      if (!isReadable(context)) return;
      if (failure.kind === "unauthenticated") {
        runtime.invalidate();
      } else if (failure.kind === "forbidden") {
        try {
          invalidate({ reason: "denial" });
        } finally {
          if (runtime.getSnapshot().generation === context.generation) runtime.denyAccess();
        }
      } else if (failure.kind === "data-unavailable") {
        invalidate({ reason: "unavailable" });
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    accounting() {
      return { entries: retained ? 1 : 0, bytes: retained?.bytes ?? 0, pending: pending ? 1 : 0 };
    },
    attach() {
      if (unregister) return;
      disposed = false;
      unregister = runtime.registerCleanup(() => { invalidate({ reason: "cleanup" }); });
    },
    dispose() {
      try {
        invalidate({ reason: "disposal" });
      } finally {
        disposed = true;
        unregister?.();
        unregister = undefined;
      }
    },
  };
  if (options.attachOnCreate !== false) cache.attach();
  return cache;
}
