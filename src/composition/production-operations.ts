import type { CatalogOperations } from "../contracts/catalog";
import type { NavigationOperations } from "../contracts/navigation";
import type { ObservationOperations } from "../contracts/observations";
import type { PreviewOperations } from "../contracts/preview";
import type { QueryOperations } from "../contracts/query";
import type { SessionOperations } from "../contracts/session";

export type ApplicationOperations = SessionOperations & CatalogOperations & ObservationOperations & PreviewOperations & QueryOperations & NavigationOperations;
export interface QuerySettings { readonly initialPageSize: number; readonly maximumPageSize: number }

/** T6.L replaces these placeholders only after versioned live contracts are accepted. */
export const productionRegistration = { status: "unavailable" } as const;
export const productionQuerySettings: QuerySettings | null = null;
const unavailable = () => ({ ok: false as const, failure: { kind: "service-failure" as const, message: "Backend connection unavailable. Session and data contracts are awaiting configuration." } });
export function createProductionOperations(): ApplicationOperations {
  return {
    resolveSession: () => Promise.resolve(unavailable()), beginLogin: () => Promise.resolve(unavailable()), logout: () => Promise.resolve(unavailable()),
    listDatasets: () => Promise.resolve(unavailable()), readSchema: () => Promise.resolve(unavailable()),
    readNationalSeries: () => Promise.resolve(unavailable()), startPreview: () => Promise.resolve(unavailable()), continuePreview: () => Promise.resolve(unavailable()),
    executeQuery: () => Promise.resolve(unavailable()), readQueryPage: () => Promise.resolve(unavailable()), consumeNavigationIntent: unavailable,
  };
}
