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
  it("leaves reads retryable and mutations uncertain after no response, with no fallback", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new Error("offline"));
    const transport = createDataHttpTransport({ fetch, isCurrent: () => true, csrfToken: () => "test-only-csrf" });
    expect(await transport.request(context, "/api/datasets")).toMatchObject({ ok: false, failure: { kind: "service-failure" } });
    expect(await transport.request(context, "/api/query", { method: "POST", body: { sql: "SELECT 1" } })).toMatchObject({ ok: false, failure: { kind: "unknown-execution-outcome" } });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
