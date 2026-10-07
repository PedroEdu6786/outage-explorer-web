import { expect, it, vi } from "vitest";
import { readCognitoLogoutUrl, readLiveConfiguration, productionPreviewSettings, productionQuerySettings } from "./config";
import { createLiveComposition } from "./live-composition";
import { createSessionRuntime } from "../session/session-runtime";
import { createAuthService } from "../features/auth/service";
import fixtures from "../../docs/specs/web-client/contracts/data-api-v1/fixtures.json";
import { createQueriesController } from "../features/queries/service";
import { createNavigationOperations } from "../composition/navigation";

it.each([false, true])("clears retained SQL and blocks late publication after another feature is denied (pending SQL: %s)", async (pendingQuery) => {
  const runtime = createSessionRuntime();
  const fetch = vi.fn<typeof globalThis.fetch>();
  const composition = createLiveComposition({ runtime, fetch, navigate: vi.fn(), authEnabled: true });
  if (!composition) throw new Error("Configured composition required");
  const queries = createQueriesController({
    runtime,
    operations: { ...composition.dataOperations, ...createNavigationOperations(runtime) },
    initialPageSize: 1,
    maximumPageSize: 500,
  });
  queries.attach();
  try {
    fetch.mockResolvedValueOnce(Response.json({ user: { id: "synthetic-user", email: "synthetic@example.invalid", role: "analyst" }, expires_at: new Date(Date.now() + 3600_000).toISOString(), csrf_token: "synthetic-memory" }));
    await createAuthService(composition.operations, runtime).perform("resolve", { onSuccess: vi.fn(), onFailure: vi.fn() });
    const catalog = fixtures.fixtures.find((item) => item.name === "catalog_analyst");
    const query = fixtures.fixtures.find((item) => item.name === "query_reference_free");
    if (!catalog || !query) throw new Error("Synthetic fixtures required");
    fetch.mockResolvedValueOnce(Response.json(catalog.body));
    await queries.loadCatalog();
    queries.editDraft("SELECT 1");
    let releaseQuery = () => { /* An immediate response needs no release. */ };
    const queryResponse = Response.json({ ...query.body, expires_at: new Date(Date.now() + 600_000).toISOString() });
    fetch.mockImplementationOnce(() => pendingQuery
      ? new Promise<Response>((resolve) => { releaseQuery = () => { resolve(queryResponse); }; })
      : Promise.resolve(queryResponse));
    const execution = queries.run();
    if (!pendingQuery) {
      await execution;
      expect(queries.getSnapshot().result).not.toBeNull();
    }
    const oldContext = runtime.capture();
    fetch.mockResolvedValueOnce(Response.json({ error: "forbidden" }, { status: 403 }));
    await composition.dataOperations.startPreview(oldContext, { datasetId: "facilities", filters: {}, pageSize: 10 });
    expect(runtime.getSnapshot().status).toBe("access-denied");
    expect(queries.getSnapshot()).toMatchObject({ result: null, catalog: [], schema: null, handoff: null, context: null });
    expect(composition.catalogCache.accounting()).toMatchObject({ entries: 0, pending: 0 });
    expect(composition.csrfToken()).toBeNull();
    releaseQuery();
    await execution;
    expect(queries.getSnapshot().result).toBeNull();
    expect(fetch.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
    // An obsolete denial cannot revoke a newly resolved identity.
    runtime.setResolution({ status: "authenticated", session: { identity: { subject: "new-viewer", displayName: "Viewer" }, capabilities: { datasetIds: ["national"], canReadNationalSeries: true, canExploreDatasets: false, canExecuteQuery: false, canRefreshDatasets: false }, expiresAt: new Date(Date.now() + 600_000).toISOString() } });
    composition.catalogCache.reportFailure(oldContext, { kind: "forbidden", message: "Old denial" });
    expect(runtime.getSnapshot().status).toBe("authenticated");
  } finally {
    queries.dispose();
    composition.dispose();
    runtime.dispose();
  }
});

it("supplies independent preview and SQL request settings", () => {
  expect(productionPreviewSettings).toEqual({ initialPageSize: 10, maximumPageSize: 500 });
  expect(productionQuerySettings).toEqual({ initialPageSize: 100, maximumPageSize: 500 });
  expect(productionPreviewSettings).not.toBe(productionQuerySettings);
});

it("builds only public Cognito logout parameters with an explicit return URL", () => {
  const value = readCognitoLogoutUrl("https://synthetic.auth.example.invalid/", "public123", "http://localhost:3000/sign-in");
  expect(value).toBe("https://synthetic.auth.example.invalid/logout?client_id=public123&logout_uri=http%3A%2F%2Flocalhost%3A3000%2Fsign-in");
  expect([...new URL(value).searchParams.keys()]).toEqual(["client_id", "logout_uri"]);
});

it("rejects missing or malformed Cognito logout configuration without echoing values", () => {
  for (const [domain, clientId, uri] of [
    [undefined, "public123", "http://localhost:3000/sign-in"],
    ["https://example.invalid", undefined, "http://localhost:3000/sign-in"],
    ["https://example.invalid", "public123", undefined],
    ["https://private@example.invalid", "public123", "http://localhost:3000/sign-in"],
    ["https://example.invalid/logout", "public123", "http://localhost:3000/sign-in"],
    ["http://example.invalid", "public123", "http://localhost:3000/sign-in"],
    ["https://example.invalid", "public123", "http://remote.invalid/sign-in"],
    ["https://example.invalid", "public123", "http://localhost:3000/sign-in?private=value"],
    ["https://example.invalid", "public123", "/sign-in"],
  ]) {
    expect(() => readCognitoLogoutUrl(domain, clientId, uri)).toThrow(/OUTAGE_AUTH_LOGOUT_URI/);
    try { readCognitoLogoutUrl(domain, clientId, uri); } catch (error) { expect(String(error)).not.toContain("private"); }
  }
});

it("leaves an absent target unavailable and accepts only credential-free origins", () => {
  expect(readLiveConfiguration(undefined)).toEqual({ status: "unavailable" });
  expect(readLiveConfiguration("")).toEqual({ status: "unavailable" });
  expect(readLiveConfiguration("http://localhost:8000")).toEqual({ status: "configured", apiOrigin: "http://localhost:8000" });
  expect(readLiveConfiguration("https://backend.example.invalid/")).toEqual({ status: "configured", apiOrigin: "https://backend.example.invalid" });
  for (const value of ["http://remote.example.invalid", "https://user:private@backend.example.invalid", "https://backend.example.invalid/api", "https://backend.example.invalid?token=private", "https://backend.example.invalid/#private", "file:///tmp/private"]) {
    expect(() => readLiveConfiguration(value)).toThrow(/OUTAGE_API_ORIGIN/);
    try { readLiveConfiguration(value); } catch (error) { expect(String(error)).not.toContain("private"); }
  }
});

it("does not instantiate or dispatch a live adapter without explicit auth configuration", () => {
  const runtime = createSessionRuntime(); const fetch = vi.fn<typeof globalThis.fetch>();
  expect(createLiveComposition({ runtime, fetch, navigate: vi.fn(), authEnabled: false })).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  runtime.dispose();
});

it("prepares authenticated data with auth-owned CSRF while leaving production registration separate", async () => {
  const runtime = createSessionRuntime(); const fetch = vi.fn<typeof globalThis.fetch>();
  const composition = createLiveComposition({ runtime, fetch, navigate: vi.fn(), authEnabled: true });
  if (!composition) throw new Error("Configured composition required");
  try {
    expect(await composition.dataOperations.listDatasets(runtime.capture())).toMatchObject({ ok: false, failure: { kind: "unauthenticated" } });
    expect(fetch).not.toHaveBeenCalled();
    const token = "synthetic-memory-csrf";
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ user: { id: "synthetic-user", email: "synthetic@example.invalid", role: "analyst" }, expires_at: new Date(Date.now() + 3600_000).toISOString(), csrf_token: token }), { status: 200 }));
    await createAuthService(composition.operations, runtime).perform("resolve", { onSuccess: vi.fn(), onFailure: vi.fn() });
    const query = fixtures.fixtures.find((item) => item.name === "query_reference_free");
    if (!query) throw new Error("Synthetic query required");
    fetch.mockResolvedValueOnce(new Response(JSON.stringify(query.body), { status: 200 }));
    const context = runtime.capture();
    expect(await composition.dataOperations.executeQuery(context, { sql: " SELECT 1\n", page: 1, pageSize: 1 })).toMatchObject({ ok: true, value: { execution: { snapshotId: null } } });
    expect(fetch.mock.calls[1]?.[1]).toMatchObject({ method: "POST", credentials: "include", cache: "no-store", redirect: "error", headers: { "X-CSRF-Token": token }, body: '{"sql":" SELECT 1\\n"}' });
    expect(JSON.stringify(runtime.getSnapshot())).not.toContain(token);
    expect(composition.operations).not.toHaveProperty("executeQuery");
    const response = new Response("{}", { status: 200 });
    vi.spyOn(response, "json").mockImplementation(async () => { await Promise.resolve(); runtime.beginLogout(); return query.body; });
    fetch.mockResolvedValueOnce(response);
    expect(await composition.dataOperations.executeQuery(context, { sql: "SELECT 1", page: 1, pageSize: 1 })).toMatchObject({ ok: false, failure: { kind: "unauthenticated" } });
    expect(composition.csrfToken()).toBe(token);
    // Logout retry may retain CSRF; that grants no analytical access.
    expect(await composition.dataOperations.readQueryPage(runtime.capture(), { queryId: "synthetic", page: 1, pageSize: 1 })).toMatchObject({ ok: false, failure: { kind: "unauthenticated" } });
    expect(fetch).toHaveBeenCalledTimes(3);
  } finally { composition.dispose(); runtime.dispose(); }
});


it("default live policy shares completed catalog and schemas until invalidation", async () => {
  const runtime = createSessionRuntime(); const fetch = vi.fn<typeof globalThis.fetch>();
  const composition = createLiveComposition({ runtime, fetch, navigate: vi.fn(), authEnabled: true });
  if (!composition) throw new Error("Configured composition required");
  try {
    expect(composition.catalogCache.policy).toMatchObject({ retention: "enabled", maximumBytes: 256 * 1024 });
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ user: { id: "synthetic-user", email: "synthetic@example.invalid", role: "analyst" }, expires_at: new Date(Date.now() + 3600_000).toISOString(), csrf_token: "synthetic-memory" }), { status: 200 }));
    await createAuthService(composition.operations, runtime).perform("resolve", { onSuccess: vi.fn(), onFailure: vi.fn() });
    const catalog = fixtures.fixtures.find((item) => item.name === "catalog_analyst"); if (!catalog) throw new Error("Catalog required");
    fetch.mockImplementation(() => Promise.resolve(new Response(JSON.stringify(catalog.body), { status: 200 })));
    const context = runtime.capture();
    await Promise.all([composition.dataOperations.listDatasets(context), composition.dataOperations.readSchema(context, "national")]);
    expect(fetch).toHaveBeenCalledTimes(2);
    await composition.dataOperations.readSchema(context, "national"); expect(fetch).toHaveBeenCalledTimes(2);
    await composition.dataOperations.listDatasets(context); expect(fetch).toHaveBeenCalledTimes(2);
    expect(composition.catalogCache.accounting().entries).toBe(1);
    composition.catalogCache.invalidate({ reason: "published-refresh" });
    await composition.dataOperations.listDatasets(context); expect(fetch).toHaveBeenCalledTimes(3);
    runtime.beginLogout();
    expect(composition.catalogCache.accounting().entries).toBe(0);
  } finally { composition.dispose(); runtime.dispose(); }
});
