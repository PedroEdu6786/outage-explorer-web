"use client";

import { useEffect, useState } from "react";
import { AuthFeature } from "../../src/features/auth";
import { OverviewFeature } from "../../src/features/overview";
import { ExplorerFeature } from "../../src/features/explorer";
import { QueriesFeature } from "../../src/features/queries";
import type { NavigationIntent } from "../../src/contracts/navigation";
import { createSessionRuntime, type SessionRuntime } from "../../src/session/session-runtime";
import { createFixtureOperations, type FixtureController } from "../fixtures/operations";
import type { FixtureOperationName } from "../fixtures/call-log";

export interface FeatureHarnessProps {
  readonly fixture?: FixtureController;
  readonly runtime?: SessionRuntime;
}

/** Test/story root only. Actual public feature entries share one runtime and adapter. */
export function FeatureHarness(props: FeatureHarnessProps) {
  const [fixture] = useState(() => props.fixture ?? createFixtureOperations());
  const [runtime] = useState(() => props.runtime ?? createSessionRuntime());
  const [view, setView] = useState<"overview" | "explorer" | "queries">("overview");
  const [intent, setIntent] = useState<NavigationIntent | null>(null);
  const [trace, setTrace] = useState("[]");
  const [releases, setReleases] = useState<readonly (() => void)[]>([]);
  useEffect(() => runtime.registerCleanup(() => { setIntent(null); setTrace("[]"); }), [runtime]);
  useEffect(() => () => { if (!props.runtime) runtime.invalidate(); }, [props.runtime, runtime]);
  const navigate = (next: NavigationIntent) => {
    const session = runtime.getSnapshot();
    if (session.status !== "authenticated" || !runtime.isCurrent({ generation: next.generation })
      || !session.session.capabilities.datasetIds.includes(next.datasetId)) return;
    setIntent(next);
    setView(next.target);
  };
  const delay = (operation: FixtureOperationName) => {
    const pending = fixture.deferNext(operation);
    setReleases((current) => [...current, pending.release]);
  };
  return <div data-fixture-root="synthetic-only">
    <p role="note">Synthetic fixture integration demo — invented test data, not EIA findings. Session and SQL settings are test choices; live integration is unverified.</p>
    <fieldset className="flex flex-wrap gap-2 p-3"><legend>Test-only session and race controls</legend>
      <button onClick={() => { fixture.setPersona("viewer"); runtime.setResolution(fixture.sessionResolution()); }}>Resolve synthetic Viewer</button>
      <button onClick={() => { fixture.setPersona("analyst"); runtime.setResolution(fixture.sessionResolution()); }}>Resolve synthetic Analyst</button>
      <button onClick={() => { runtime.invalidate("pending"); }}>Withhold unresolved session</button>
      <button onClick={() => { delay("readSchema"); }}>Delay next schema</button>
      <button onClick={() => { delay("startPreview"); }}>Delay next preview</button>
      <button onClick={() => { delay("executeQuery"); }}>Delay next execution</button>
      <button onClick={() => { fixture.failNext("readSchema", { kind: "unauthenticated", message: "Synthetic obsolete identity" }); }}>Fail next schema as unauthenticated</button>
      <button onClick={() => { fixture.failNext("startPreview", { kind: "forbidden", message: "Synthetic obsolete permission" }); }}>Fail next preview as forbidden</button>
      <button onClick={() => { releases.forEach((release) => { release(); }); setReleases([]); }}>Release delayed responses</button>
      <button onClick={() => { setTrace(JSON.stringify(fixture.callLog.read())); }}>Inspect synthetic calls</button>
    </fieldset>
    <output data-testid="call-trace" aria-label="Synthetic operation trace" className="block max-h-32 overflow-auto">{trace}</output>
    <AuthFeature operations={fixture.operations} runtime={runtime}>{({ signOut }) => <>
      <nav aria-label="Harness views" className="flex flex-wrap gap-4 p-3">
        <button onClick={() => { setView("overview"); }}>Overview view</button>
        <button onClick={() => { setView("explorer"); }}>Explorer view</button>
        <button onClick={() => { setView("queries"); }}>SQL view</button>
        <button onClick={signOut}>Sign out</button>
      </nav>
      <section aria-label="Overview feature" hidden={view !== "overview"}><OverviewFeature operations={fixture.operations} runtime={runtime} onNavigate={navigate} /></section>
      <section aria-label="Explorer feature" hidden={view !== "explorer"}><ExplorerFeature operations={fixture.operations} runtime={runtime} intent={intent?.target === "explorer" ? intent : null} onNavigate={navigate} initialPageSize={2} /></section>
      <section aria-label="Queries feature" hidden={view !== "queries"}><QueriesFeature operations={fixture.operations} runtime={runtime} intent={intent?.target === "queries" ? intent : null} initialPageSize={2} maximumPageSize={100} /></section>
    </>}</AuthFeature>
  </div>;
}
