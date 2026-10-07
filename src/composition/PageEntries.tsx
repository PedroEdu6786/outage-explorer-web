"use client";
import { useEffect, type ReactNode } from "react";
import { AppShell } from "../components/templates/AppShell";
import { StatusMessage } from "../components/molecules/StatusMessage";
import { OverviewFeature } from "../features/overview";
import { ExplorerFeature } from "../features/explorer";
import { QueriesFeature } from "../features/queries";
import { useApplication, useApplicationSession, useAuthControls } from "./ApplicationProvider";
import { canAccessPath, navigationData, routeTitles } from "./navigation";

export function ProtectedLayout({ children }: { readonly children: ReactNode }) {
  const app = useApplication();
  const session = useApplicationSession();
  const controls = useAuthControls();
  const allowed = canAccessPath(session, app.path);
  useEffect(() => {
    if (session.status === "authenticated" && !allowed && app.path !== "/overview") app.go("/overview");
  }, [session.status, allowed, app.path, app.go]);
  return <AppShell title={routeTitles[app.path]} navigation={navigationData(session, app.path)} onSignOut={controls.signOut}>{allowed ? children : <StatusMessage title="Opening Overview" pending />}</AppShell>;
}
export function SignInEntry() {
  const { go } = useApplication();
  useEffect(() => { go("/overview"); }, [go]);
  return <StatusMessage title="Opening your workspace" pending />;
}
export function OverviewEntry() {
  const app = useApplication();
  return <OverviewFeature {...(app.operations.refresh ? { refreshOperations: app.operations.refresh } : {})} operations={app.operations} runtime={app.runtime} onNavigate={app.navigate} onPublished={() => { app.catalogCache.invalidate({ reason: "published-refresh" }); }} />;
}
export function ExplorerEntry() {
  const app = useApplication();
  return <ExplorerFeature operations={app.operations} runtime={app.runtime} onNavigate={app.navigate} intent={app.intent?.target === "explorer" ? app.intent : null} initialPageSize={app.previewPageSize} />;
}
export function QueryEntry() {
  const app = useApplication();
  if (!app.querySettings || !app.queries) return <StatusMessage title="SQL workspace unavailable" description="SQL settings and backend connection await an approved contract." tone="warning" />;
  return <QueriesFeature operations={app.operations} runtime={app.runtime} controller={app.queries} {...app.querySettings} intent={app.intent?.target === "queries" ? app.intent : null} />;
}
