import type { NavigationData, NavigationDestination } from "../components/organisms/AppNavigation";
import type { NavigationIntent, NavigationOperations } from "../contracts/navigation";
import type { SessionState } from "../contracts/session";
import type { SessionRuntime } from "../session/session-runtime";
import { isCalendarDate } from "../lib/calendar-date";

export type ApplicationPath = "/sign-in" | "/overview" | "/datasets" | "/query";

export const routeTitles: Record<ApplicationPath, string> = {
  "/sign-in": "Sign in",
  "/overview": "Overview",
  "/datasets": "Dataset Explorer",
  "/query": "SQL Workspace",
};

export function navigationData(session: SessionState, path: ApplicationPath): NavigationData {
  if (session.status !== "authenticated") {
    return { status: "pending" };
  }

  const { identity, capabilities } = session.session;
  const destinations: NavigationDestination[] = [];

  if (capabilities.canReadNationalSeries) {
    destinations.push({
      id: "overview",
      href: "/overview",
      label: "Overview",
      icon: "overview",
      active: path === "/overview",
    });
  }

  if (capabilities.canExploreDatasets && capabilities.datasetIds.length > 0) {
    destinations.push({
      id: "datasets",
      href: "/datasets",
      label: "Dataset Explorer",
      icon: "datasets",
      active: path === "/datasets",
    });
  }

  if (capabilities.canExecuteQuery) {
    destinations.push({
      id: "query",
      href: "/query",
      label: "SQL Workspace",
      icon: "sql",
      active: path === "/query",
    });
  }

  const initials = identity.displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

  return {
    status: "ready",
    revision: session.generation,
    identity: { name: identity.displayName, initials },
    destinations,
  };
}

export function acceptsIntent(runtime: SessionRuntime, intent: NavigationIntent) {
  const session = runtime.getSnapshot();

  return (
    session.status === "authenticated" &&
    runtime.isCurrent({ generation: intent.generation }) &&
    session.session.capabilities.datasetIds.includes(intent.datasetId) &&
    canAccessPath(session, intent.target === "explorer" ? "/datasets" : "/query")
  );
}

/** Fixed public relation names from the accepted catalog contract; unsent text only. */
export function createNavigationOperations(runtime: SessionRuntime): NavigationOperations {
  const relations: Record<string, string | undefined> = {
    national: "national",
    facilities: "facilities",
    generators: "generators",
  };

  return {
    consumeNavigationIntent(context, intent) {
      const relation = Object.hasOwn(relations, intent.datasetId)
        ? relations[intent.datasetId]
        : undefined;

      if (
        context.signal?.aborted ||
        context.generation !== intent.generation ||
        !acceptsIntent(runtime, intent) ||
        relation === undefined
      ) {
        return {
          ok: false,
          failure: { kind: "forbidden", message: "Dataset context is unavailable." },
        };
      }

      const { dates, facilityId } = intent.filters;

      if (
        facilityId !== undefined ||
        (dates?.start !== undefined && !isCalendarDate(dates.start)) ||
        (dates?.end !== undefined && !isCalendarDate(dates.end)) ||
        (dates?.start !== undefined && dates.end !== undefined && dates.start > dates.end)
      ) {
        return {
          ok: false,
          failure: { kind: "invalid-input", message: "Invalid navigation filters." },
        };
      }

      return {
        ok: true,
        value:
          intent.target === "explorer"
            ? { target: "explorer", datasetId: intent.datasetId, filters: intent.filters }
            : {
                target: "queries",
                datasetId: intent.datasetId,
                filters: intent.filters,
                proposedDraft: `SELECT * FROM ${relation}`,
              },
      };
    },
  };
}

/** Page access is separate from national metadata needed by Overview. */
export function canAccessPath(session: SessionState, path: ApplicationPath): boolean {
  if (session.status !== "authenticated") {
    return false;
  }

  const { capabilities } = session.session;

  if (path === "/datasets") {
    return capabilities.canExploreDatasets && capabilities.datasetIds.length > 0;
  }

  if (path === "/query") {
    return capabilities.canExecuteQuery;
  }

  return path === "/overview" && capabilities.canReadNationalSeries;
}
