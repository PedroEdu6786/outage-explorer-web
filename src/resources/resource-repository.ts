import type { OperationResult } from "../contracts/failures";
import type { OperationContext } from "../contracts/session";
import type { ResourceIdentity, ResourceInvalidation, ResourceMetadata, ResourceOwnership, ResourcePolicy, ResourceRead, ResourceRepository } from "../contracts/resources";
import type { SessionRuntime } from "../session/session-runtime";

export const catalogResourcePolicy: ResourcePolicy = { retention: "enabled", maximumEntries: 1, maximumBytes: 256 * 1024, decide: () => "reuse" };
export const disabledResourcePolicy: ResourcePolicy = { retention: "disabled" };
const obsolete = (): OperationResult<never> => ({ ok: false, failure: { kind: "unauthenticated", message: "Session or resource context changed." } });
interface Entry { metadata: ResourceMetadata; value: unknown }
interface Pending { readonly identity: ResourceIdentity; readonly abort: AbortController; readonly epoch: number; readonly denied: () => boolean; readonly promise: Promise<OperationResult<unknown>> }
/** Protected open-app memory. Policy admission refuses excess metadata entries; catalog retention lasts until invalidation or page reload. */
export function createResourceRepository(options: { readonly runtime: SessionRuntime; readonly policy: ResourcePolicy; readonly now?: () => number; readonly attachOnCreate?: boolean }): ResourceRepository {
  const { runtime, policy } = options;
  const now = options.now ?? Date.now;
  if (policy.retention === "enabled" && (!Number.isSafeInteger(policy.maximumEntries) || policy.maximumEntries <= 0 || !Number.isSafeInteger(policy.maximumBytes) || policy.maximumBytes <= 0)) throw new Error("Explicit positive retention budgets required");
  const entries = new Map<string, Entry>();
  const pending = new Map<string, Pending>();
  const epochs = new Map<string, number>();
  const listeners = new Set<(event: ResourceInvalidation) => void>();
  let globalEpoch = 0;
  let disposed = false;
  let unregister: (() => void) | undefined;
  const unavailableContext = (context: OperationContext): OperationResult<never> => runtime.isCurrent(context) && runtime.getSnapshot().status === "authenticated"
    ? { ok: false, failure: { kind: "service-failure", message: "This metadata read was invalidated. Try again deliberately." } } : obsolete();
  const key = (identity: ResourceIdentity) => JSON.stringify([identity.kind, identity.requestKey]);
  const epoch = (id: string) => globalEpoch + (epochs.get(id) ?? 0);
  function owner(context: OperationContext): ResourceOwnership | null {
    if (disposed || !runtime.isCurrent(context)) return null;
    const state = runtime.getSnapshot();
    if (state.status !== "authenticated") return null;
    const capabilities = state.session.capabilities;
    return { subject: state.session.identity.subject, sessionGeneration: state.generation, capabilities: { ...capabilities, datasetIds: [...capabilities.datasetIds] } };
  }
  const matches = (context: OperationContext, ownership: ResourceOwnership) => JSON.stringify(owner(context)) === JSON.stringify(ownership);
  function invalidate(event: ResourceInvalidation) {
    const all = event.reason === "cleanup" || event.reason === "denial" || event.reason === "disposal";
    if (all) globalEpoch += 1;
    const affected = (identity: ResourceIdentity) => all || (!("requestKey" in event) || identity.requestKey === event.requestKey);
    const revoked = new Set<string>();
    for (const [id, entry] of entries) if (affected(entry.metadata.identity)) { entries.delete(id); revoked.add(id); }
    for (const [id, work] of pending) if (affected(work.identity)) { pending.delete(id); revoked.add(id); work.abort.abort(); }
    if (!all) for (const id of revoked) epochs.set(id, (epochs.get(id) ?? 0) + 1);
    if (all) epochs.clear();
    const errors: unknown[] = [];
    for (const listener of [...listeners]) { try { listener(event); } catch (error) { errors.push(error); } }
    if (errors.length) throw new AggregateError(errors, "Resource invalidation listeners failed");
  }
  const repository: ResourceRepository = {
    policy,
    attach() { if (unregister) return; disposed = false; unregister = runtime.registerCleanup(() => { invalidate({ reason: "cleanup" }); }); },
    dispose() { try { invalidate({ reason: "disposal" }); } finally { disposed = true; unregister?.(); unregister = undefined; } },
    invalidate,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    accounting() { return { entries: entries.size, bytes: [...entries.values()].reduce((sum, entry) => sum + entry.metadata.bytes, 0), pending: pending.size }; },
    reportFailure(context, failure) {
      if (disposed || !runtime.isCurrent(context) || runtime.getSnapshot().status !== "authenticated") return;
      if (failure.kind === "unauthenticated") runtime.invalidate();
      else if (failure.kind === "forbidden") invalidate({ reason: "denial" });
      else if (failure.kind === "data-unavailable") invalidate({ reason: "unavailable", kind: "catalog" });
    },
    async read<T>(input: ResourceRead<T>): Promise<OperationResult<T>> {
      const ownership = owner(input.context);
      if (!ownership) return unavailableContext(input.context);
      const id = key(input.identity);
      const version = epoch(id);
      const retained = entries.get(id);
      if (retained && matches(input.context, retained.metadata.ownership) && retained.metadata.epoch === version) {
        const decision = policy.retention === "enabled" ? policy.decide(retained.metadata, now()) : "fetch";
        if (decision === "reuse") return { ok: true, value: retained.value as T };
        entries.delete(id);
      }
      let work = pending.get(id);
      if (!work) {
        const abort = new AbortController();
        const context = { generation: input.context.generation, signal: abort.signal };
        const valid = () => !abort.signal.aborted && epoch(id) === version && matches(context, ownership);
        let denied = false;
        const promise = Promise.resolve().then(() => valid() ? input.load(context) : unavailableContext(input.context)).catch((): OperationResult<T> => ({ ok: false, failure: { kind: "service-failure", message: "The resource could not be read. Try again deliberately." } })).then((result) => {
          if (!valid()) return unavailableContext(input.context);
          if (!result.ok) {
            entries.delete(id);
            denied = result.failure.kind === "forbidden";
            if (denied) pending.delete(id);
            repository.reportFailure(context, result.failure);
            return result;
          }
          if (policy.retention === "enabled") {
            const description = input.describe?.(result.value);
            const bytes = new TextEncoder().encode(JSON.stringify(result.value)).byteLength;
            const metadata: ResourceMetadata = { identity: input.identity, ...(description?.dataGeneration !== undefined ? { dataGeneration: description.dataGeneration } : {}), ownership, epoch: version, fetchedAt: now(), bytes };
            const totals = repository.accounting();
            const oldBytes = entries.get(id)?.metadata.bytes ?? 0;
            if (totals.entries + (entries.has(id) ? 0 : 1) <= policy.maximumEntries && totals.bytes - oldBytes + bytes <= policy.maximumBytes && policy.decide(metadata, now()) === "reuse") entries.set(id, { metadata, value: result.value });
          }
          return result;
        }).catch((): OperationResult<T> => ({ ok: false, failure: { kind: "service-failure", message: "The metadata read could not complete. Try again deliberately." } })).finally(() => { if (pending.get(id)?.abort === abort) pending.delete(id); });
        work = { identity: input.identity, abort, epoch: version, denied: () => denied, promise };
        pending.set(id, work);
      }
      const currentWork = work;
      return new Promise((resolve, reject) => {
        const signal = input.context.signal;
        const detach = () => { signal?.removeEventListener("abort", abortConsumer); currentWork.abort.signal.removeEventListener("abort", abortConsumer); };
        const abortConsumer = () => { detach(); resolve(unavailableContext(input.context)); };
        currentWork.abort.signal.addEventListener("abort", abortConsumer, { once: true });
        signal?.addEventListener("abort", abortConsumer, { once: true });
        if (signal?.aborted || currentWork.abort.signal.aborted) { abortConsumer(); return; }
        void currentWork.promise.then((result) => {
          detach();
          resolve(!signal?.aborted && (currentWork.epoch === epoch(id) || currentWork.denied()) && matches(input.context, ownership) ? result as OperationResult<T> : unavailableContext(input.context));
        }).catch(() => { detach(); reject(new Error("Metadata publication could not complete")); });
      });
    },
  };
  if (options.attachOnCreate !== false) repository.attach();
  return repository;
}
