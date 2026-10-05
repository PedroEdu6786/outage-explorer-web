import { expect, it, vi } from "vitest";
import { readLiveConfiguration } from "./config";
import { createLiveComposition } from "./live-composition";
import { createSessionRuntime } from "../session/session-runtime";

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
