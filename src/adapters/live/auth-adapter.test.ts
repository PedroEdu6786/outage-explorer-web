import { afterEach, describe, expect, it, vi } from "vitest";
import { createSessionRuntime } from "../../session/session-runtime";
import { createAuthService } from "../../features/auth/service";
import { createAuthAdapter } from "./auth-adapter";

const resources: (() => void)[] = [];
afterEach(() => { resources.splice(0).forEach((dispose) => { dispose(); }); vi.useRealTimers(); });
function payload(role = "viewer", token = "synthetic-session-csrf") {
  return { user: { id: "000opaque-application-id", email: "synthetic@example.invalid", role }, expires_at: new Date(Date.now() + 3600_000).toISOString(), csrf_token: token };
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const logoutUrl = "https://synthetic.auth.example.invalid/logout?client_id=public123&logout_uri=http%3A%2F%2Flocalhost%3A3000%2Fsign-in";
function setup() {
  const runtime = createSessionRuntime();
  const fetch = vi.fn<typeof globalThis.fetch>();
  const navigate = vi.fn();
  const adapter = createAuthAdapter({ runtime, fetch, navigate, logoutUrl });
  const service = createAuthService(adapter.operations, runtime);
  resources.push(() => { adapter.dispose(); runtime.dispose(); });
  const callbacks = { onSuccess: vi.fn(), onFailure: vi.fn() };
  return { runtime, fetch, navigate, adapter, service, callbacks };
}

describe("live auth adapter with controlled HTTP responses", () => {
  it.each([
    ["viewer", ["national"]],
    ["analyst", ["national", "facilities", "generators"]],
    ["admin", ["national", "facilities", "generators"]],
  ] as const)("maps user-confirmed %s presentation restrictions without sending permission claims", async (role, datasetIds) => {
    const { runtime, fetch, adapter, service, callbacks } = setup();
    const body = payload(role);
    fetch.mockResolvedValue(json(body));
    await service.perform("resolve", callbacks);
    expect(runtime.getSnapshot()).toMatchObject({ status: "authenticated", session: { identity: { subject: body.user.id, displayName: body.user.email }, capabilities: { datasetIds, canReadNationalSeries: true, canExploreDatasets: role !== "viewer", canExecuteQuery: role !== "viewer" }, expiresAt: body.expires_at } });
    expect(JSON.stringify(runtime.getSnapshot())).not.toContain(body.csrf_token);
    expect(adapter.csrfToken()).toBe(body.csrf_token);
    expect(fetch).toHaveBeenCalledExactlyOnceWith("/api/auth/session", { method: "GET", credentials: "include", cache: "no-store", redirect: "error" });
  });

  it("navigates to Flask login without fetching or resolving identity", async () => {
    const { fetch, navigate, runtime, service, callbacks } = setup();
    await service.perform("login", callbacks);
    expect(navigate).toHaveBeenCalledExactlyOnceWith("/api/auth/login?return_to=%2F");
    expect(fetch).not.toHaveBeenCalled();
    expect(runtime.getSnapshot().status).toBe("pending");
  });

  it.each(["unknown-role", "missing-role", "bad-expiry", "timezone-free", "missing-csrf", "missing-id"])("withholds malformed session %s without publishing raw contents", async (scenario) => {
    const { fetch, runtime, adapter, service, callbacks } = setup();
    const body: Record<string, unknown> = payload();
    if (scenario === "unknown-role") body.user = { ...payload().user, role: "superuser" };
    if (scenario === "missing-role") body.user = { id: "opaque", email: "synthetic@example.invalid" };
    if (scenario === "missing-id") body.user = { email: "synthetic@example.invalid", role: "viewer" };
    if (scenario === "bad-expiry") body.expires_at = "2026-02-30T12:00:00Z";
    if (scenario === "timezone-free") body.expires_at = "2026-10-05T12:00:00";
    if (scenario === "missing-csrf") delete body.csrf_token;
    fetch.mockResolvedValue(json(body));
    await service.perform("resolve", callbacks);
    expect(runtime.getSnapshot().status).toBe("pending");
    expect(adapter.csrfToken()).toBeNull();
    expect(callbacks.onFailure).toHaveBeenCalledWith(expect.objectContaining({ kind: "service-failure" }));
  });

  it("accepts backend offset/microsecond expiry and never extends its instant", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-05T15:00:00Z"));
    const { fetch, runtime, adapter, service, callbacks } = setup();
    const body = { ...payload(), expires_at: "2026-10-05T16:12:28.636104+00:00" };
    fetch.mockResolvedValue(json(body));
    await service.perform("resolve", callbacks);
    vi.advanceTimersByTime(1000);
    fetch.mockResolvedValue(json(body));
    await service.perform("resolve", callbacks);
    vi.setSystemTime(Date.parse(body.expires_at));
    expect(runtime.isCurrent(runtime.capture())).toBe(true);
    expect(runtime.getSnapshot().status).toBe("expired");
    expect(adapter.csrfToken()).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each([503, 403, "network"] as const)("retains only the scoped token for deliberate logout retry after %s", async (status) => {
    const { fetch, runtime, adapter, service, callbacks, navigate } = setup();
    fetch.mockResolvedValueOnce(json(payload()));
    await service.perform("resolve", callbacks);
    if (status === "network") fetch.mockRejectedValueOnce(new Error("private connection detail"));
    else fetch.mockResolvedValueOnce(json({ error: { message: "private provider detail" } }, status));
    await service.perform("logout", callbacks);
    expect(runtime.getSnapshot()).toMatchObject({ status: "pending", reason: "logout" });
    expect(navigate).not.toHaveBeenCalled();
    expect(adapter.csrfToken()).toBe("synthetic-session-csrf");
    expect(fetch.mock.calls[1]).toEqual(["/api/auth/logout", { method: "POST", credentials: "include", cache: "no-store", redirect: "error", headers: { "X-CSRF-Token": "synthetic-session-csrf" } }]);
    expect(JSON.stringify(callbacks.onFailure.mock.calls)).not.toContain("private");
    const generation = runtime.getSnapshot().generation;
    fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await service.perform("logout", callbacks);
    expect(fetch.mock.calls[2]?.[1]?.headers).toEqual({ "X-CSRF-Token": "synthetic-session-csrf" });
    expect(runtime.getSnapshot()).toMatchObject({ status: "unauthenticated", generation: generation + 1 });
    expect(adapter.csrfToken()).toBeNull();
    expect(navigate).toHaveBeenCalledExactlyOnceWith(logoutUrl);
  });

  it("never treats unexpected 200 logout as confirmation and supports repeated 204 logout", async () => {
    const { fetch, runtime, service, callbacks, navigate } = setup();
    fetch.mockResolvedValueOnce(json(payload())); await service.perform("resolve", callbacks);
    callbacks.onSuccess.mockClear();
    fetch.mockResolvedValueOnce(json({})); await service.perform("logout", callbacks);
    expect(callbacks.onSuccess).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(runtime.getSnapshot()).toMatchObject({ status: "pending", reason: "logout" });
    fetch.mockResolvedValueOnce(new Response(null, { status: 204 })); await service.perform("logout", callbacks);
    fetch.mockResolvedValueOnce(new Response(null, { status: 204 })); await service.perform("logout", callbacks);
    expect(fetch.mock.calls[3]?.[1]?.headers).toBeUndefined();
    expect(runtime.getSnapshot().status).toBe("unauthenticated");
  });

  it("waits for 204, confirms locally before browser navigation, then resolves the returned session as signed out", async () => {
    const { fetch, runtime, adapter, service, callbacks, navigate } = setup();
    fetch.mockResolvedValueOnce(json(payload())); await service.perform("resolve", callbacks);
    let release!: (response: Response) => void;
    fetch.mockReturnValueOnce(new Promise((resolve) => { release = resolve; }));
    const operation = service.perform("logout", callbacks);
    expect(navigate).not.toHaveBeenCalled();
    expect(runtime.getSnapshot()).toMatchObject({ status: "pending", reason: "logout" });
    navigate.mockImplementation(() => {
      expect(runtime.getSnapshot().status).toBe("unauthenticated");
      expect(adapter.csrfToken()).toBeNull();
    });
    release(new Response(null, { status: 204 }));
    await operation;
    expect(navigate).toHaveBeenCalledExactlyOnceWith(logoutUrl);
    expect(fetch).toHaveBeenCalledTimes(2);
    fetch.mockResolvedValueOnce(json({}, 401)); await service.perform("resolve", callbacks);
    expect(runtime.getSnapshot().status).toBe("unauthenticated");
    await service.perform("login", callbacks);
    expect(navigate).toHaveBeenLastCalledWith("/api/auth/login?return_to=%2F");
  });

  it.each(["identity-change", "abort"] as const)("discards late logout 204 after %s without navigating", async (change) => {
    const { fetch, runtime, service, callbacks, navigate } = setup();
    fetch.mockResolvedValueOnce(json(payload())); await service.perform("resolve", callbacks);
    let release!: (response: Response) => void;
    fetch.mockReturnValueOnce(new Promise((resolve) => { release = resolve; }));
    const controller = new AbortController();
    const operation = service.perform("logout", callbacks, controller.signal);
    if (change === "abort") controller.abort();
    else {
      runtime.invalidate("pending");
      fetch.mockResolvedValueOnce(json(payload("analyst", "new-token")));
      await service.perform("resolve", callbacks);
    }
    callbacks.onSuccess.mockClear();
    release(new Response(null, { status: 204 }));
    await expect(operation).resolves.toBe("discarded");
    expect(navigate).not.toHaveBeenCalled();
    expect(callbacks.onSuccess).not.toHaveBeenCalled();
  });

  it("clears tokens at original expiry even while logout remains unresolved", async () => {
    vi.useFakeTimers();
    const { fetch, runtime, adapter, service, callbacks } = setup();
    fetch.mockResolvedValueOnce(json(payload())); await service.perform("resolve", callbacks);
    fetch.mockResolvedValueOnce(json({}, 503)); await service.perform("logout", callbacks);
    vi.advanceTimersByTime(3600_000);
    expect(adapter.csrfToken()).toBeNull();
    expect(runtime.getSnapshot()).toMatchObject({ status: "pending", reason: "logout" });
    fetch.mockResolvedValueOnce(new Response(null, { status: 204 })); await service.perform("logout", callbacks);
    expect(fetch.mock.calls[2]?.[1]?.headers).toBeUndefined();
  });

  it.each([401, 403, 503])("handles session %s without exposing old protected identity", async (status) => {
    const { fetch, runtime, adapter, service, callbacks } = setup();
    fetch.mockResolvedValueOnce(json(payload())); await service.perform("resolve", callbacks);
    fetch.mockResolvedValueOnce(json({}, status)); await service.perform("resolve", callbacks);
    expect(runtime.getSnapshot().status).toBe(status === 401 ? "unauthenticated" : "pending");
    expect(adapter.csrfToken()).toBeNull();
    if (status !== 401) expect(callbacks.onFailure).toHaveBeenCalled();
  });

  it("discards stale response bodies and cannot move an old token into another identity", async () => {
    const { fetch, runtime, adapter, service, callbacks } = setup();
    let release!: (response: Response) => void;
    fetch.mockReturnValueOnce(new Promise((resolve) => { release = resolve; }));
    const pending = service.perform("resolve", callbacks);
    runtime.invalidate();
    fetch.mockResolvedValueOnce(json({ ...payload("analyst", "new-session-token"), user: { ...payload("analyst").user, id: "new-identity" } }));
    await service.perform("resolve", callbacks);
    release(json(payload("viewer", "old-token")));
    await expect(pending).resolves.toBe("discarded");
    expect(adapter.csrfToken()).toBe("new-session-token");
    runtime.invalidate("pending");
    expect(adapter.csrfToken()).toBeNull();
  });

  it("keeps independent adapter sessions isolated", async () => {
    const first = setup(); const second = setup();
    first.fetch.mockResolvedValueOnce(json(payload("viewer", "first-token")));
    second.fetch.mockResolvedValueOnce(json(payload("analyst", "second-token")));
    await first.service.perform("resolve", first.callbacks); await second.service.perform("resolve", second.callbacks);
    first.fetch.mockResolvedValueOnce(new Response(null, { status: 204 })); await first.service.perform("logout", first.callbacks);
    expect(second.adapter.csrfToken()).toBe("second-token");
    expect(second.runtime.getSnapshot().status).toBe("authenticated");
  });

  it("clears the retry token on logout 401 without claiming successful logout", async () => {
    const { fetch, runtime, adapter, service, callbacks, navigate } = setup();
    fetch.mockResolvedValueOnce(json(payload())); await service.perform("resolve", callbacks);
    callbacks.onSuccess.mockClear();
    fetch.mockResolvedValueOnce(json({}, 401)); await service.perform("logout", callbacks);
    expect(runtime.getSnapshot().status).toBe("unauthenticated");
    expect(adapter.csrfToken()).toBeNull();
    expect(callbacks.onSuccess).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("discards JSON decoding that completes after abort without exposing a token", async () => {
    const { fetch, runtime, adapter, service, callbacks } = setup();
    let release!: (body: unknown) => void;
    const response = json({});
    vi.spyOn(response, "json").mockReturnValue(new Promise((resolve) => { release = resolve; }));
    fetch.mockResolvedValueOnce(response);
    const controller = new AbortController();
    const operation = service.perform("resolve", callbacks, controller.signal);
    await Promise.resolve();
    controller.abort();
    release(payload());
    await expect(operation).resolves.toBe("discarded");
    expect(runtime.getSnapshot().status).toBe("pending");
    expect(adapter.csrfToken()).toBeNull();
    expect(callbacks.onSuccess).not.toHaveBeenCalled();
    expect(callbacks.onFailure).not.toHaveBeenCalled();
  });
});
