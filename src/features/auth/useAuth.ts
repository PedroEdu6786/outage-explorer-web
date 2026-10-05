"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { OperationFailure } from "../../contracts/failures";
import type { SessionOperations, SessionState } from "../../contracts/session";
import type { SessionRuntime } from "../../session/session-runtime";
import { createAuthService } from "./service";

const serverSnapshot: SessionState = { status: "pending", generation: 0 };
export type AuthActivity =
  | { readonly status: "idle" }
  | { readonly status: "working"; readonly action: "resolve" | "login" | "logout" }
  | { readonly status: "redirecting" }
  | { readonly status: "failure"; readonly action: "resolve" | "login" | "logout"; readonly failure: OperationFailure };

export function useAuth(operations: SessionOperations, runtime: SessionRuntime) {
  const session = useSyncExternalStore(runtime.subscribe, runtime.getSnapshot, () => serverSnapshot);
  const service = useMemo(() => createAuthService(operations, runtime), [operations, runtime]);
  const [activity, setActivity] = useState<AuthActivity>(() => {
    const state = runtime.getSnapshot();
    return state.status === "pending" && state.reason === "logout"
      ? { status: "failure", action: "logout", failure: { kind: "service-failure", message: "Sign-out has not been confirmed. Retry to confirm." } }
      : { status: "idle" };
  });
  const active = useRef<AbortController | null>(null);
  const initialResolution = useRef<Promise<unknown> | null>(null);
  const run = useCallback(async (action: "resolve" | "login" | "logout") => {
    if (active.current !== null) {
      if (action !== "logout") return;
      active.current.abort();
    }
    const controller = new AbortController();
    active.current = controller;
    setActivity({ status: "working", action });
    const outcome = await service.perform(action, {
      onSuccess: () => { setActivity(action === "login" ? { status: "redirecting" } : { status: "idle" }); },
      onFailure: (failure) => { setActivity({ status: "failure", action, failure }); },
    }, controller.signal);
    if (active.current === controller) {
      active.current = null;
      if (outcome === "discarded") setActivity({ status: "idle" });
    }
  }, [service]);
  useEffect(() => {
    const state = runtime.getSnapshot();
    if (state.status === "pending" && state.reason !== "logout" && initialResolution.current === null) {
      initialResolution.current = run("resolve");
    }
    return () => {
      active.current?.abort();
      active.current = null;
      initialResolution.current = null;
    };
  }, [run, runtime]);
  useEffect(() => runtime.registerCleanup(() => {
    // Resolve itself transitions generation; its publication callback resets activity.
    // External transitions also remove any obsolete login/error presentation.
    const state = runtime.getSnapshot();
    setActivity(state.status === "pending" && state.reason === "logout"
      ? { status: "working", action: "logout" }
      : { status: "idle" });
  }), [runtime]);
  return {
    session, activity,
    signIn: () => run("login"),
    signOut: () => run("logout"),
    resolve: () => run("resolve"),
  };
}
