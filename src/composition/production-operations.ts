import type { CatalogCache } from "../contracts/catalog-cache";
import type { RefreshOperations } from "../contracts/refresh";
import type { CatalogOperations } from "../contracts/catalog";
import type { NavigationOperations } from "../contracts/navigation";
import type { ObservationOperations } from "../contracts/observations";
import type { PreviewOperations } from "../contracts/preview";
import type { QueryOperations } from "../contracts/query";
import type { SessionOperations } from "../contracts/session";
import type { SessionRuntime } from "../session/session-runtime";
import { createLiveComposition } from "../integration/live-composition";
import { createNavigationOperations } from "./navigation";

export { productionQuerySettings, productionPreviewSettings } from "../integration/config";

export type ApplicationOperations = SessionOperations &
  CatalogOperations &
  ObservationOperations &
  PreviewOperations &
  QueryOperations &
  NavigationOperations & {
    readonly refresh?: RefreshOperations;
    readonly catalogCache?: CatalogCache;
  };

export interface QuerySettings {
  readonly initialPageSize: number;
  readonly maximumPageSize: number;
}

/** Structural registration only; connected T5.L/T6.L acceptance remains separate. */
export const productionRegistration = { status: "ready" } as const;

const unavailable = () => ({
  ok: false as const,
  failure: {
    kind: "service-failure" as const,
    message:
      "Backend connection unavailable. Session and data contracts are awaiting configuration.",
  },
});

export function createProductionOperations(options?: {
  readonly runtime: SessionRuntime;
  readonly authEnabled: boolean;
  readonly logoutUrl?: string | undefined;
  readonly catalogCache?: CatalogCache;
}): ApplicationOperations {
  const live = options
    ? createLiveComposition({
        ...options,
        fetch: (...args) => globalThis.fetch(...args),
        navigate: (path) => {
          window.location.assign(path);
        },
      })
    : null;

  return {
    resolveSession: () => Promise.resolve(unavailable()),
    beginLogin: () => Promise.resolve(unavailable()),
    logout: () => Promise.resolve(unavailable()),
    listDatasets: () => Promise.resolve(unavailable()),
    readSchema: () => Promise.resolve(unavailable()),
    readNationalSeries: () => Promise.resolve(unavailable()),
    startPreview: () => Promise.resolve(unavailable()),
    continuePreview: () => Promise.resolve(unavailable()),
    executeQuery: () => Promise.resolve(unavailable()),
    readQueryPage: () => Promise.resolve(unavailable()),
    consumeNavigationIntent: unavailable,
    ...live?.operations,
    ...live?.dataOperations,
    ...(live ? { catalogCache: live.catalogCache } : {}),
    ...(live && options ? createNavigationOperations(options.runtime) : {}),
  };
}
