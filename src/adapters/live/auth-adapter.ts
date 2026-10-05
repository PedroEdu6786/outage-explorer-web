import type { OperationFailure, OperationResult } from "../../contracts/failures";
import type { OperationContext, SessionOperations, SessionResolution } from "../../contracts/session";
import type { SessionRuntime } from "../../session/session-runtime";
import { authSessionSchema, mapAuthSession } from "./auth-schema";

export interface AuthAdapterOptions {
  readonly runtime: SessionRuntime;
  readonly fetch: typeof globalThis.fetch;
  readonly navigate: (path: string) => void;
  readonly now?: () => number;
}
interface SessionSecret {
  readonly generation: number;
  readonly subject: string;
  readonly expiresAt: string;
  readonly token: string;
}
const unavailable = (): OperationFailure => ({ kind: "service-failure", message: "The session service is unavailable. Try again deliberately." });
const obsolete = (): OperationFailure => ({ kind: "unauthenticated", message: "Session context changed." });
function failure(status: number): OperationFailure {
  if (status === 401) return { kind: "unauthenticated", message: "Sign in to continue." };
  if (status === 403) return { kind: "forbidden", message: "Access denied." };
  if (status === 400) return { kind: "invalid-input", message: "The authentication request could not be completed. Check the connection configuration." };
  return unavailable();
}

export function createAuthAdapter(options: AuthAdapterOptions) {
  const { runtime } = options;
  const now = options.now ?? Date.now;
  let secret: SessionSecret | null = null;
  let candidate: SessionSecret | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let detachAbort: (() => void) | undefined;
  function clearTokens() {
    secret = null;
    candidate = null;
    clearTimeout(timer);
    timer = undefined;
    detachAbort?.();
    detachAbort = undefined;
  }
  function scheduleTokenExpiry(expiresAt: string) {
    clearTimeout(timer);
    const expire = () => {
      const remaining = Date.parse(expiresAt) - now();
      if (remaining <= 0) clearTokens();
      else timer = setTimeout(expire, Math.min(remaining, 2_147_483_647));
    };
    expire();
  }
  const unregister = runtime.registerCleanup(() => {
    const state = runtime.getSnapshot();
    if (state.status === "authenticated" && candidate?.generation === state.generation
      && candidate.subject === state.session.identity.subject && candidate.expiresAt === state.session.expiresAt) {
      secret = candidate;
      detachAbort?.();
      detachAbort = undefined;
    } else if (state.status === "pending" && state.reason === "logout" && secret?.generation === state.generation - 1) {
      // A logout retains only its original session's retry credential, without access.
      secret = { ...secret, generation: state.generation };
    } else {
      clearTokens();
    }
    candidate = null;
  });
  function csrfToken(): string | null {
    const state = runtime.getSnapshot();
    if (secret?.generation !== state.generation || Date.parse(secret.expiresAt) <= now()
      || (state.status !== "authenticated" && !(state.status === "pending" && state.reason === "logout"))) {
      clearTokens();
    }
    return secret?.token ?? null;
  }
  async function request(context: OperationContext, path: string, init: RequestInit): Promise<Response | null> {
    if (!runtime.isCurrent(context)) return null;
    const response = await options.fetch(path, {
      ...init, credentials: "include", cache: "no-store", redirect: "error",
      ...(context.signal ? { signal: context.signal } : {}),
    });
    return runtime.isCurrent(context) ? response : null;
  }
  const operations: SessionOperations = {
    async resolveSession(context): Promise<OperationResult<SessionResolution>> {
      try {
        const response = await request(context, "/api/auth/session", { method: "GET" });
        if (!response) return { ok: false, failure: obsolete() };
        if (response.status === 401) { clearTokens(); return { ok: true, value: { status: "unauthenticated" } }; }
        if (response.status !== 200) { clearTokens(); return { ok: false, failure: failure(response.status) }; }
        const raw: unknown = await response.json();
        if (!runtime.isCurrent(context)) return { ok: false, failure: obsolete() };
        const parsed = authSessionSchema.safeParse(raw);
        if (!parsed.success) { clearTokens(); return { ok: false, failure: unavailable() }; }
        const dto = parsed.data;
        if (Date.parse(dto.expires_at) <= now()) { clearTokens(); return { ok: true, value: { status: "expired" } }; }
        clearTokens();
        candidate = { generation: context.generation + 1, subject: dto.user.id, expiresAt: dto.expires_at, token: dto.csrf_token };
        scheduleTokenExpiry(dto.expires_at);
        if (context.signal) {
          const signal = context.signal;
          const abort = () => { clearTokens(); };
          signal.addEventListener("abort", abort, { once: true });
          detachAbort = () => { signal.removeEventListener("abort", abort); };
        }
        return { ok: true, value: { status: "authenticated", session: mapAuthSession(dto) } };
      } catch {
        return { ok: false, failure: unavailable() };
      }
    },
    beginLogin(context) {
      if (!runtime.isCurrent(context)) return Promise.resolve({ ok: false, failure: obsolete() });
      try {
        options.navigate("/api/auth/login?return_to=%2F");
        return Promise.resolve({ ok: true, value: undefined });
      } catch {
        return Promise.resolve({ ok: false, failure: unavailable() });
      }
    },
    async logout(context) {
      try {
        // Expired/invalid sessions support repeat logout without a CSRF token.
        const token = csrfToken();
        const response = await request(context, "/api/auth/logout", { method: "POST", ...(token ? { headers: { "X-CSRF-Token": token } } : {}) });
        if (!response) return { ok: false, failure: obsolete() };
        if (response.status === 204) { clearTokens(); return { ok: true, value: undefined }; }
        if (response.status === 401) clearTokens();
        return { ok: false, failure: failure(response.status) };
      } catch {
        // The backend may still hold the cookie; retain the current retry token.
        return { ok: false, failure: unavailable() };
      }
    },
  };
  return { operations, csrfToken, dispose: () => { clearTokens(); unregister(); } };
}
