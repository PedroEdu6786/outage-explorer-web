import type { DataTransport } from "../adapters/live/data-adapter";
import { decodeFailure } from "../adapters/live/error-mapping";

export interface DataHttpOptions {
  readonly fetch: typeof globalThis.fetch;
  readonly isCurrent: DataTransport["isCurrent"];
  /** Auth-owned session memory only. Never provider tokens. */
  readonly csrfToken: () => string | null;
}
/** Cookie transport for prepared data; production registration is a separate gate. */
export function createDataHttpTransport(options: DataHttpOptions): DataTransport {
  return {
    isCurrent: options.isCurrent,
    async request(context, path, request) {
      if ((context.signal?.aborted || !options.isCurrent(context))) return { ok: false, failure: { kind: "unauthenticated", message: "Session context changed." } };
      // Callers cannot use this cookie-bearing transport for arbitrary origins.
      if (!/^\/api\/(?:datasets(?:\/(?:national|facilities|generators)\/preview)?|query)(?:\?[^#]*)?$/.test(path)
        || (request && !/^\/api\/query(?:\?|$)/.test(path))) return { ok: false, failure: { kind: "invalid-input", message: "Unsupported API path." } };
      const token = options.csrfToken();
      if (request && !token) return { ok: false, failure: { kind: "unauthenticated", message: "Resolve your session before running SQL." } };
      const current = () => !context.signal?.aborted && options.isCurrent(context) && options.csrfToken() === token;
      const obsolete = () => ({ ok: false as const, failure: { kind: "unauthenticated" as const, message: "Session context changed." } });
      try {
        const response = await options.fetch(path, {
          method: request?.method ?? "GET", credentials: "include", cache: "no-store", redirect: "error",
          ...(context.signal ? { signal: context.signal } : {}),
          ...(request && token ? { headers: { "Content-Type": "application/json", "X-CSRF-Token": token }, body: JSON.stringify(request.body) } : {}),
        });
        if (!current()) return obsolete();
        if (response.redirected || response.type === "opaqueredirect") throw new Error("Unexpected redirect");
        if (response.status === 401 || response.status === 403) return { ok: false, failure: decodeFailure(response.status, null) };
        const body: unknown = await response.json();
        if (!current()) return obsolete();
        if (response.status === 200) return { ok: true, value: body };
        const failure = decodeFailure(response.status, body);
        // A non-contract execution response cannot confirm whether work ran.
        if (request && failure.kind === "service-failure" && failure.code === undefined) throw new Error("Unconfirmed execution response");
        return { ok: false, failure };
      } catch {
        if (!current()) return obsolete();
        return request
          ? { ok: false, failure: { kind: "unknown-execution-outcome", message: "The execution response was not received. The query may have executed; use Run deliberately." } }
          : { ok: false, failure: { kind: "service-failure", message: "The backend could not be reached or its response was invalid. Try again deliberately." } };
      }
    },
  };
}
