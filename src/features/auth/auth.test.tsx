import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createFixtureOperations } from "../../../tests/fixtures/operations";
import { Button } from "../../components/atoms/Button";
import { createSessionRuntime, type SessionRuntime } from "../../session/session-runtime";
import { AuthFeature, type AuthControls } from "./AuthFeature";
import { createAuthService } from "./service";

const runtimes: SessionRuntime[] = [];
function setup(signedIn = false) {
  const controller = createFixtureOperations({ persona: "analyst" });
  const runtime = createSessionRuntime();
  runtimes.push(runtime);
  if (signedIn) runtime.setResolution(controller.sessionResolution());
  else runtime.invalidate();
  const protectedContent = vi.fn(({ signOut }: AuthControls) => <div>Protected analysis<Button onClick={signOut}>Sign out</Button></div>);
  const entry = <AuthFeature operations={controller.operations} runtime={runtime}>{protectedContent}</AuthFeature>;
  return { controller, runtime, protectedContent, entry };
}
afterEach(() => { runtimes.splice(0).forEach((runtime) => { runtime.dispose(); }); vi.useRealTimers(); });

describe("Auth fixture lifecycle", () => {
  it("does not invoke or mount protected content during a held pending resolution", async () => {
    const { controller, runtime, entry, protectedContent } = setup();
    runtime.invalidate("pending");
    const delayed = controller.deferNext("resolveSession");
    render(entry);
    expect(screen.getByText("Checking session")).toBeInTheDocument();
    expect(protectedContent).not.toHaveBeenCalled();
    expect(controller.callLog.read().map((call) => call.operation)).toEqual(["resolveSession"]);
    await act(async () => { delayed.release(); await Promise.resolve(); });
    await screen.findByText("Protected analysis");
  });
  it("withholds protected rendering on the server even with an authenticated client runtime", () => {
    const { entry, protectedContent } = setup(true);
    expect(renderToString(entry)).not.toContain("Protected analysis");
    expect(protectedContent).not.toHaveBeenCalled();
  });

  it("withholds the protected subtree until session resolution, including StrictMode remount", async () => {
    const { controller, runtime, entry, protectedContent } = setup();
    runtime.invalidate("pending");
    const delayed = controller.deferNext("resolveSession");
    render(<StrictMode>{entry}</StrictMode>);
    expect(screen.queryByText("Protected analysis")).not.toBeInTheDocument();
    // StrictMode can resolve using its second request. No stale first publication.
    await act(async () => { delayed.release(); await Promise.resolve(); });
    await waitFor(() => { expect(screen.getByText("Protected analysis")).toBeInTheDocument(); });
    expect(protectedContent).toHaveBeenCalled();
  });

  it("never treats beginLogin success as authenticated or resolves implicitly", async () => {
    const { controller, runtime, entry, protectedContent } = setup();
    render(entry);
    fireEvent.click(screen.getByRole("button", { name: "Continue to sign in" }));
    await screen.findByText("Complete managed sign-in");
    expect(runtime.getSnapshot().status).toBe("unauthenticated");
    expect(protectedContent).not.toHaveBeenCalled();
    expect(controller.callLog.read().map((call) => call.operation)).toEqual(["beginLogin"]);
    fireEvent.click(screen.getByRole("button", { name: "Check session" }));
    await screen.findByText("Protected analysis");
    expect(controller.callLog.read().map((call) => call.operation)).toEqual(["beginLogin", "resolveSession"]);
  });

  it("deduplicates sign-in clicks during a pending operation", async () => {
    const { controller, entry } = setup();
    const delayed = controller.deferNext("beginLogin");
    render(entry);
    const button = screen.getByRole("button", { name: "Continue to sign in" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(controller.callLog.read()).toHaveLength(1);
    await act(async () => { delayed.release(); await Promise.resolve(); });
  });

  it("expires at the supplied one-hour instant, clears protected state and waits for explicit sign-in", async () => {
    vi.useFakeTimers();
    const { controller, runtime, entry } = setup(true);
    const cleanup = vi.fn();
    runtime.registerCleanup(cleanup);
    render(entry);
    await act(async () => { vi.advanceTimersByTime(3_600_000); await Promise.resolve(); });
    expect(screen.queryByText("Protected analysis")).not.toBeInTheDocument();
    expect(screen.getByText("Session expired")).toBeInTheDocument();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(controller.callLog.read()).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Continue to sign in" }));
    await act(async () => { await Promise.resolve(); });
    expect(controller.callLog.read().map((call) => call.operation)).toEqual(["beginLogin"]);
  });

  it("clears protected state before delayed logout completes and does not touch an independent runtime", async () => {
    const { controller, runtime, entry } = setup(true);
    const independent = createSessionRuntime();
    runtimes.push(independent);
    independent.setResolution(controller.sessionResolution());
    const cleanup = vi.fn();
    runtime.registerCleanup(cleanup);
    const delayed = controller.deferNext("logout");
    render(entry);
    const before = runtime.capture();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(runtime.isCurrent(before)).toBe(false);
    expect(cleanup).toHaveBeenCalledOnce();
    expect(screen.queryByText("Protected analysis")).not.toBeInTheDocument();
    expect(controller.callLog.read()[0]?.generation).toBeGreaterThan(before.generation);
    expect(independent.getSnapshot().status).toBe("authenticated");
    await act(async () => { delayed.release(); await Promise.resolve(); });
    expect(screen.getByRole("button", { name: "Continue to sign in" })).toBeEnabled();
  });

  it("distinguishes logout uncertainty and offers deliberate current-session retry", async () => {
    const { controller, runtime, entry } = setup(true);
    controller.failNext("logout", { kind: "service-failure", message: "Synthetic logout failure" });
    render(entry);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await screen.findByText("Sign-out not confirmed");
    expect(runtime.getSnapshot().status).toBe("unauthenticated");
    expect(screen.queryByText("Protected analysis")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry sign out" }));
    await screen.findByRole("button", { name: "Continue to sign in" });
    expect(controller.callLog.read().map((call) => call.operation)).toEqual(["logout", "logout"]);
  });

  it.each(["forbidden", "service-failure"] as const)("shows actionable %s resolution failure without protected content or automatic retry", async (kind) => {
    const { controller, runtime, entry, protectedContent } = setup();
    runtime.invalidate("pending");
    controller.failNext("resolveSession", { kind, message: "Synthetic resolution failure" });
    render(entry);
    await screen.findByRole("alert");
    expect(screen.getByText(kind === "forbidden" ? "Access denied" : "Sign-in unavailable")).toBeInTheDocument();
    expect(protectedContent).not.toHaveBeenCalled();
    expect(controller.callLog.read()).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Check session again" }));
    await screen.findByText("Protected analysis");
    expect(controller.callLog.read()).toHaveLength(2);
  });

  it.each(["success", "unauthenticated", "forbidden", "rejection"] as const)("discards stale %s resolution after another identity and capability generation", async (outcome) => {
    const { controller, runtime } = setup();
    if (outcome === "unauthenticated" || outcome === "forbidden") controller.failNext("resolveSession", { kind: outcome, message: "Synthetic old identity" });
    const delayed = controller.deferNext("resolveSession");
    const callbacks = { onSuccess: vi.fn(), onFailure: vi.fn() };
    const operation = createAuthService(controller.operations, runtime).perform("resolve", callbacks);
    controller.setPersona("viewer");
    runtime.setResolution(controller.sessionResolution());
    const generation = runtime.getSnapshot().generation;
    if (outcome === "rejection") delayed.reject(new Error("secret adapter details"));
    else delayed.release();
    await expect(operation).resolves.toBe("discarded");
    expect(callbacks.onSuccess).not.toHaveBeenCalled();
    expect(callbacks.onFailure).not.toHaveBeenCalled();
    expect(runtime.getSnapshot().generation).toBe(generation);
    const snapshot = runtime.getSnapshot();
    expect(snapshot.status === "authenticated" && snapshot.session.capabilities.datasetIds).toEqual(["synthetic-national"]);
  });

  it("does not publish a delayed resolution after the feature unmounts", async () => {
    const { controller, runtime, entry } = setup();
    runtime.invalidate("pending");
    const delayed = controller.deferNext("resolveSession");
    const view = render(entry);
    view.unmount();
    await act(async () => { delayed.release(); await Promise.resolve(); });
    expect(runtime.getSnapshot().status).toBe("pending");
  });

  it("hides rejected adapter internals and exposes generic recovery", async () => {
    const { controller, entry } = setup();
    const delayed = controller.deferNext("beginLogin");
    render(entry);
    fireEvent.click(screen.getByRole("button", { name: "Continue to sign in" }));
    await act(async () => { delayed.reject(new Error("secret token and internal callback")); await Promise.resolve(); });
    await screen.findByRole("alert");
    expect(screen.queryByText(/secret token/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try sign in again" })).toBeEnabled();
  });
});
