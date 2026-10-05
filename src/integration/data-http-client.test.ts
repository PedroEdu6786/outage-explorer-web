import { describe, expect, it, vi } from "vitest";
import { createDataHttpTransport } from "./data-http-client";
const context = { generation: 1 };
describe("Prepared HTTP transport with injected responses", () => {
  it("uses same-origin cookies and memory CSRF without retries, browser Origin overrides or storage", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response("{}", { status: 200 }));
    const transport = createDataHttpTransport({ fetch, isCurrent: () => true, csrfToken: () => "test-only-csrf" });
    await transport.request(context, "/api/query?page=1&page_size=100", { method: "POST", body: { sql: "SELECT 1" } });
    expect(fetch).toHaveBeenCalledExactlyOnceWith("/api/query?page=1&page_size=100", {
      method: "POST", credentials: "include", cache: "no-store", redirect: "error", headers: { "Content-Type": "application/json", "X-CSRF-Token": "test-only-csrf" }, body: '{"sql":"SELECT 1"}',
    });
  });
  it("refuses missing CSRF and foreign paths without dispatch", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    const transport = createDataHttpTransport({ fetch, isCurrent: () => true, csrfToken: () => null });
    expect(await transport.request(context, "/api/query", { method: "POST", body: { sql: "SELECT 1" } })).toMatchObject({ ok: false, failure: { kind: "unauthenticated" } });
    expect(await transport.request(context, "https://example.com/api/datasets")).toMatchObject({ ok: false });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects unsupported cookie-bearing paths and mutation routes before dispatch", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    const transport = createDataHttpTransport({ fetch, isCurrent: () => true, csrfToken: () => "synthetic" });
    for (const path of ["//example.invalid/api/query", "/api/datasets/../preview", "/api/datasets/%2e%2e/preview", "/api/datasets/national%2F..%2Fauth/preview", "/api/query#private", "/api/auth/session"]) {
      expect(await transport.request(context, path)).toMatchObject({ ok: false, failure: { kind: "invalid-input" } });
    }
    expect(await transport.request(context, "/api/datasets", { method: "POST", body: { sql: "SELECT 1" } })).toMatchObject({ ok: false, failure: { kind: "invalid-input" } });
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["before", "fetch", "json", "abort", "token", "rejection"] as const)("rejects %s context loss without publishing a result or replaying SQL", async (stage) => {
    let current = stage !== "before";
    let token: string | null = "synthetic";
    const abort = new AbortController();
    const response = new Response("{}", { status: 200 });
    vi.spyOn(response, "json").mockImplementation(async () => {
      await Promise.resolve();
      if (stage === "json" || stage === "rejection") current = false;
      if (stage === "abort") abort.abort();
      if (stage === "token") token = null;
      if (stage === "rejection") throw new Error("private decode error");
      return {};
    });
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(() => {
      if (stage === "fetch") current = false;
      return Promise.resolve(response);
    });
    const transport = createDataHttpTransport({ fetch, isCurrent: () => current, csrfToken: () => token });
    expect(await transport.request({ ...context, signal: abort.signal }, "/api/query", { method: "POST", body: { sql: " SELECT 1\n" } })).toMatchObject({ ok: false, failure: { kind: "unauthenticated" } });
    expect(fetch).toHaveBeenCalledTimes(stage === "before" ? 0 : 1);
  });
  it("rejects redirect responses and does not retry an uncertain execution", async () => {
    const response = new Response("{}", { status: 200 });
    Object.defineProperty(response, "redirected", { value: true });
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response);
    const transport = createDataHttpTransport({ fetch, isCurrent: () => true, csrfToken: () => "synthetic" });
    expect(await transport.request(context, "/api/query", { method: "POST", body: { sql: "SELECT 1" } })).toMatchObject({ ok: false, failure: { kind: "unknown-execution-outcome" } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("leaves reads retryable and mutations uncertain after no response, with no fallback", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new Error("offline"));
    const transport = createDataHttpTransport({ fetch, isCurrent: () => true, csrfToken: () => "test-only-csrf" });
    expect(await transport.request(context, "/api/datasets")).toMatchObject({ ok: false, failure: { kind: "service-failure" } });
    expect(await transport.request(context, "/api/query", { method: "POST", body: { sql: "SELECT 1" } })).toMatchObject({ ok: false, failure: { kind: "unknown-execution-outcome" } });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
