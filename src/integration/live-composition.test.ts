import { expect, it, vi } from "vitest";
import { readCognitoLogoutUrl, readLiveConfiguration } from "./config";
import { createLiveComposition } from "./live-composition";
import { createSessionRuntime } from "../session/session-runtime";

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
