"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { SessionProvider } from "../../src/session/SessionProvider";
import { createSessionRuntime, type SessionRuntime } from "../../src/session/session-runtime";
import { createFixtureOperations, type FixtureController, type FixtureOptions } from "./operations";
import type { FixturePersona } from "./scenarios";

interface FixtureContextValue {
  readonly controller: FixtureController;
  readonly runtime: SessionRuntime;
  readonly setPersona: (persona: FixturePersona) => void;
}

const FixtureContext = createContext<FixtureContextValue | null>(null);

export interface FixtureProviderProps {
  readonly children: ReactNode;
  readonly options?: FixtureOptions;
}

/** Story/test-only root. Every composition visibly identifies its synthetic data. */
export function FixtureProvider({ children, options }: FixtureProviderProps) {
  const [controller] = useState(() => createFixtureOperations(options));
  const [runtime] = useState(() => createSessionRuntime());
  useEffect(() => {
    runtime.setResolution(controller.sessionResolution());
    // Invalidate rather than dispose: React StrictMode reruns this mount effect.
    return () => { runtime.invalidate(); };
  }, [controller, runtime]);
  const value: FixtureContextValue = {
    controller,
    runtime,
    setPersona(persona) {
      controller.setPersona(persona);
      runtime.setResolution(controller.sessionResolution());
    },
  };
  return <FixtureContext.Provider value={value}>
    <SessionProvider runtime={runtime}>
      <div data-fixture-root="synthetic-only">
        <p role="note">Synthetic fixture demo — invented test data, not EIA findings. Session and SQL settings are test choices; live integration is unverified.</p>
        {children}
      </div>
    </SessionProvider>
  </FixtureContext.Provider>;
}

export function useFixtureController(): FixtureContextValue {
  const value = useContext(FixtureContext);
  if (!value) throw new Error("FixtureProvider is required in this test/story composition");
  return value;
}
