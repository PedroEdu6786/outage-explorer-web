"use client";

import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import { createCatalogCache } from "../../src/resources/catalog-cache";
import type { CatalogCache } from "../../src/contracts/catalog-cache";
import { SessionProvider } from "../../src/session/SessionProvider";
import { createSessionRuntime, type SessionRuntime } from "../../src/session/session-runtime";
import { createFixtureOperations, syntheticCatalogCachePolicy, type FixtureController, type FixtureOptions } from "./operations";
import type { FixturePersona } from "./scenarios";

interface FixtureContextValue {
  readonly controller: FixtureController;
  readonly runtime: SessionRuntime;
  readonly catalogCache: CatalogCache;
  readonly setPersona: (persona: FixturePersona) => void;
}

const FixtureContext = createContext<FixtureContextValue | null>(null);

export interface FixtureProviderProps {
  readonly children: ReactNode;
  readonly options?: FixtureOptions;
}

/** Story/test-only root. Every composition visibly identifies its synthetic data. */
export function FixtureProvider({ children, options }: FixtureProviderProps) {
  const [runtime] = useState(() => createSessionRuntime());
  const [catalogCache] = useState(() => createCatalogCache({ runtime, policy: syntheticCatalogCachePolicy, attachOnCreate: false }));
  const [controller] = useState(() => createFixtureOperations({ ...options, catalogCache }));
  useLayoutEffect(() => {
    catalogCache.attach();
    runtime.setResolution(controller.sessionResolution());
    // Invalidate rather than dispose: React StrictMode reruns this mount effect.
    return () => { runtime.invalidate(); catalogCache.dispose(); };
  }, [controller, runtime, catalogCache]);
  const value: FixtureContextValue = {
    controller,
    runtime,
    catalogCache,
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
