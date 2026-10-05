import { z } from "zod";
import type { OperationFailure, OperationResult } from "../../contracts/failures";
import type { RefreshOperations, RefreshSummary } from "../../contracts/refresh";
import type { OperationContext } from "../../contracts/session";
import type { SessionRuntime } from "../../session/session-runtime";
import { dateSchema } from "./data-schema";

const summarySchema = z.object({
  run_id: z.string().min(1).max(256),
  status: z.enum(["accepted", "running", "succeeded", "retained", "failed", "interrupted", "publication_unknown"]),
  effective_interval: z.object({ start_date: dateSchema, end_date: dateSchema }).refine((range) => range.start_date <= range.end_date),
  stage: z.enum(["queued", "retrieving", "modeling", "persisting", "verifying", "publishing", "finished"]).optional(),
});
function decode(raw: unknown): RefreshSummary {
  const value = summarySchema.parse(raw);
  return { runId: value.run_id, status: value.status, interval: { start: value.effective_interval.start_date, end: value.effective_interval.end_date }, ...(value.stage ? { stage: value.stage } : {}) };
}
const failure = (kind: OperationFailure["kind"], message: string): OperationResult<never> => ({ ok: false, failure: { kind, message } });
export function createRefreshAdapter(options: { readonly runtime: SessionRuntime; readonly fetch: typeof globalThis.fetch; readonly csrfToken: () => string | null }): RefreshOperations {
  const current = (context: OperationContext) => options.runtime.isCurrent(context);
  async function request(context: OperationContext, runId?: string, key?: string): Promise<OperationResult<RefreshSummary | null>> {
    if (!current(context)) return failure("unauthenticated", "Session context changed.");
    const session = options.runtime.getSnapshot();
    if (session.status !== "authenticated") return failure("unauthenticated", "Sign in to continue.");
    if (!session.session.capabilities.canRefreshDatasets) return failure("forbidden", "Only Admins can refresh data.");
    const token = key ? options.csrfToken() : null;
    if (key && !token) return failure("unauthenticated", "Resolve your session before refreshing data.");
    try {
      const response = await options.fetch(key ? "/api/refresh" : `/api/refresh/${runId === undefined ? "latest" : encodeURIComponent(runId)}`, {
        method: key ? "POST" : "GET", credentials: "include", cache: "no-store", redirect: "error",
        ...(context.signal ? { signal: context.signal } : {}),
        ...(key && token ? { headers: { "Content-Type": "application/json", "X-CSRF-Token": token, "Idempotency-Key": key }, body: "{}" } : {}),
      });
      if (!current(context)) return failure("unauthenticated", "Session context changed.");
      if (response.status === 401) return failure("unauthenticated", "Sign in to continue.");
      if (response.status === 403) return failure("forbidden", "Refresh access denied.");
      if (response.status === 409) return failure("busy", "Refresh admission conflicted or another refresh is active. Check refresh status before retrying.");
      if (response.status !== 200 && !(key && response.status === 202)) throw new Error("Unavailable response");
      const raw: unknown = await response.json();
      if (!current(context)) return failure("unauthenticated", "Session context changed.");
      if (!key && runId === undefined) {
        const latest = z.object({ run: summarySchema.nullable() }).parse(raw);
        return { ok: true, value: latest.run === null ? null : decode(latest.run) };
      }
      const value = decode(raw);
      if (runId !== undefined && value.runId !== runId) throw new Error("Run changed");
      return { ok: true, value };
    } catch {
      return failure("service-failure", key ? "Refresh admission was not confirmed. Retry admission with the same request or check refresh status." : "Refresh status is unavailable. Check again deliberately.");
    }
  }
  return {
    async admitRefresh(context, key) {
      if (!/^[A-Za-z0-9_-]{16,128}$/.test(key)) return failure("invalid-input", "Invalid refresh request key.");
      const result = await request(context, undefined, key);
      if (!result.ok) return result;
      return result.value === null ? failure("service-failure", "Invalid refresh response.") : { ok: true, value: result.value };
    },
    readRefresh: (context, runId) => request(context, runId),
  };
}
