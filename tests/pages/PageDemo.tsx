"use client";
import { useCallback, useEffect, useState } from "react";
import SignInPage from "../../src/app/sign-in/page";
import OverviewPage from "../../src/app/(protected)/overview/page";
import DatasetsPage from "../../src/app/(protected)/datasets/page";
import QueryPage from "../../src/app/(protected)/query/page";
import ProtectedLayout from "../../src/app/(protected)/layout";
import { ApplicationProvider } from "../../src/composition/ApplicationProvider";
import { routeTitles, type ApplicationPath } from "../../src/composition/navigation";
import { createSessionRuntime } from "../../src/session/session-runtime";
import { createFixtureOperations } from "../fixtures/operations";
import { syntheticZoomSeries } from "../fixtures/overview-zoom";

export interface PageDemoProps {
  readonly initialPath: ApplicationPath;
  readonly mode?: "ready" | "signed-out" | "expired" | "pending" | "failure" | "viewer";
  readonly zoomYears?: 1 | 2;
}
/** Test root owns all synthetic identity, lifecycle settings and controls. Actual routes are imported. */
export function PageDemo({ initialPath, mode = "ready", zoomYears }: PageDemoProps) {
  const [setup] = useState(() => {
    const fixture = createFixtureOperations({ persona: mode === "viewer" ? "viewer" : "analyst", ...(zoomYears ? { nationalSeries: syntheticZoomSeries(zoomYears) } : {}) });
    const runtime = createSessionRuntime();
    const deferred = mode === "pending" ? fixture.deferNext("resolveSession") : null;
    if (mode === "signed-out") { void fixture.operations.logout(runtime.capture()); runtime.invalidate(); }
    else if (mode === "expired") runtime.invalidate("expired");
    else if (mode === "failure") fixture.failNext("resolveSession", { kind: "service-failure", message: "Synthetic backend connection failure." });
    return { fixture, runtime, deferred };
  });
  const { fixture, runtime } = setup;
  const [path, setPath] = useState(initialPath);
  const [trace, setTrace] = useState("[]");
  const go = useCallback((next: ApplicationPath) => { setPath(next); }, []);
  useEffect(() => () => { runtime.invalidate(); }, [runtime]);
  const [querySettings] = useState(() => ({ initialPageSize: 2, maximumPageSize: 100 }));
  const content = path === "/sign-in" ? <SignInPage /> : <ProtectedLayout>{path === "/overview" ? <OverviewPage /> : path === "/datasets" ? <DatasetsPage /> : <QueryPage />}</ProtectedLayout>;
  return <div data-fixture-root="synthetic-only">
    <div className="relative z-40 bg-white p-2 text-[12px]" data-testid="fixture-controls">
      <p role="note">Synthetic fixture page demo — invented test data, not EIA findings. Session and SQL settings are test choices.</p>
      <output data-testid="route-path" aria-label="Fixture route">{path}</output>
      <button onClick={() => { setTrace(JSON.stringify(fixture.callLog.read())); }}>Inspect synthetic calls</button>
      <button onClick={() => { fixture.setPersona("viewer"); runtime.setResolution(fixture.sessionResolution()); }}>Resolve synthetic Viewer</button>
      <button onClick={() => { runtime.invalidate("pending"); }}>Withhold unresolved session</button>
      <button onClick={() => { setup.deferred?.release(); }}>Release session</button>
      <button onClick={() => { fixture.failNext("continuePreview", { kind: "preview-expired", message: "Synthetic cursor expired." }); }}>Expire next cursor</button>
      <button onClick={() => { fixture.loseResults(); }}>Lose SQL results</button>
      <button onClick={() => { fixture.failNextExecution({ kind: "busy", message: "Synthetic backend is busy." }); }}>Make next Run busy</button>
      <output data-testid="call-trace" aria-label="Synthetic operation trace">{trace}</output>
    </div>
    <ApplicationProvider operations={fixture.operations} runtime={runtime} path={path} go={go} querySettings={querySettings} previewPageSize={2}>
      <div onClick={(event) => {
        const href = (event.target as Element).closest("a")?.getAttribute("href");
        if (href && href in routeTitles && !event.metaKey && !event.ctrlKey) { event.preventDefault(); go(href as ApplicationPath); }
      }}>{content}</div>
    </ApplicationProvider>
  </div>;
}
