import { z } from "zod";
import type { OperationFailure } from "../../contracts/failures";
import { instantSchema, opaqueSchema } from "./data-schema";
const envelope = z.object({ error: z.object({
  code: z.string(), message: z.string(), retry_after_seconds: z.number().int().min(1).max(3600).optional(),
  details: z.object({ query_id: opaqueSchema, expires_at: instantSchema }).strict().optional(),
}).strict() }).strict();
/** Do not expose raw response messages or unknown internal details to the UI. */
export function decodeFailure(status: number, raw: unknown): OperationFailure {
  if (status === 401) return { kind: "unauthenticated", code: "unauthenticated", message: "Sign in to continue." };
  if (status === 403) return { kind: "forbidden", code: "forbidden", message: "Access denied." };
  const parsed = envelope.safeParse(raw);
  const code = parsed.success ? parsed.data.error.code : undefined;
  const base: OperationFailure = { kind: "service-failure", message: "The service is unavailable. Try again deliberately." };
  const known: Record<string, readonly [number, OperationFailure["kind"], string]> = {
    unauthenticated: [401, "unauthenticated", "Sign in to continue."],
    forbidden: [403, "forbidden", "Access denied."],
    invalid_request: [400, "invalid-input", "Check the request parameters."],
    invalid_sql: [400, "invalid-input", "Check the SQL statement."],
    unsupported_sql: [400, "unsupported-sql", "This SQL statement is not supported."],
    page_out_of_range: [400, "invalid-input", "The requested page is outside the retained result."],
    page_size_mismatch: [400, "invalid-input", "Use the original execution page size."],
    dataset_unavailable: [404, "data-unavailable", "Dataset unavailable."],
    preview_unavailable: [410, "preview-expired", "This preview is unavailable. Restart browsing."],
    query_resource_limit: [422, "resource-limit", "The query exceeded an execution resource limit."],
    query_busy: [503, "busy", "The query engine is busy. Try Run again deliberately."],
    query_timeout: [504, "execution-timeout", "The execution deadline was exceeded."],
    data_unavailable: [503, "data-unavailable", "Published data is unavailable."],
    service_unavailable: [503, "service-failure", "The service is unavailable. Try again deliberately."],
  };
  let mapped = code ? known[code] : undefined;
  if (code === "query_unavailable" && (status === 404 || status === 410)) mapped = [status, status === 410 ? "result-expired" : "result-lost", "Retained results are unavailable. Use Run deliberately for a new execution."];
  if (code === "result_capacity_exhausted" && (status === 429 || status === 503)) mapped = [status, "capacity-exhausted", status === 429 ? "Your retained-result capacity is exhausted. Wait for results to expire before another Run." : "The service has no retained-result capacity. Try Run again later."];
  if (!parsed.success || mapped?.[0] !== status) return base;
  const error = parsed.data.error;
  return { kind: mapped[1], message: mapped[2], code: error.code,
    ...(error.retry_after_seconds === undefined ? {} : { retryAfterSeconds: error.retry_after_seconds }),
    ...(code === "page_out_of_range" && error.details ? { retainedQuery: { queryId: error.details.query_id, expiresAt: error.details.expires_at } } : {}),
  };
}
