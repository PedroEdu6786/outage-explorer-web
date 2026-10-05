import type { CatalogOperations } from "../contracts/catalog";
import type { NavigationOperations } from "../contracts/navigation";
import type { ObservationOperations } from "../contracts/observations";
import type { PreviewOperations } from "../contracts/preview";
import type { QueryOperations } from "../contracts/query";
import type { SessionOperations } from "../contracts/session";
import type { SessionRuntime } from "../session/session-runtime";
import { createLiveComposition } from "../integration/live-composition";

export type ApplicationOperations = SessionOperations & CatalogOperations & ObservationOperations & PreviewOperations & QueryOperations & NavigationOperations;
export interface QuerySettings { readonly initialPageSize: number; readonly maximumPageSize: number }

/** T6.L replaces these placeholders only after versioned live contracts are accepted. */
export const productionRegistration = { status: "unavailable" } as const;
export const productionQuerySettings: QuerySettings | null = null;
const unavailable = () => ({ ok: false as const, failure: { kind: "service-failure" as const, message: "Backend connection unavailable. Session and data contracts are awaiting configuration." } });
export function createProductionOperations(options?: { readonly runtime: SessionRuntime; readonly authEnabled: boolean }): ApplicationOperations {
  const auth = options ? createLiveComposition({
    ...options, fetch: (...args) => globalThis.fetch(...args), navigate: (path) => { window.location.assign(path); },
  }) : null;
  const dataUnavailable = auth ? () => ({ ok: false as const, failure: { kind: "service-failure" as const, message: "Data services are not connected yet." } }) : unavailable;
  return {
    resolveSession: () => Promise.resolve(unavailable()), beginLogin: () => Promise.resolve(unavailable()), logout: () => Promise.resolve(unavailable()),
    listDatasets: () => Promise.resolve(dataUnavailable()), readSchema: () => Promise.resolve(dataUnavailable()),
    readNationalSeries: () => Promise.resolve(dataUnavailable()), startPreview: () => Promise.resolve(dataUnavailable()), continuePreview: () => Promise.resolve(dataUnavailable()),
    executeQuery: () => Promise.resolve(dataUnavailable()), readQueryPage: () => Promise.resolve(dataUnavailable()), consumeNavigationIntent: dataUnavailable,
    ...auth?.operations,
  };
}
