import { expect, it } from "vitest";
import type { DateBounds } from "../contracts/catalog";
import { createSessionRuntime } from "../session/session-runtime";
import { createNavigationOperations } from "./navigation";

it("preserves optional handoff dates and year zero while rejecting impossible and reversed ranges", () => {
  const runtime = createSessionRuntime();
  runtime.setResolution({ status: "authenticated", session: {
    identity: { subject: "synthetic-user", displayName: "Analyst" },
    capabilities: { datasetIds: ["national"], canReadNationalSeries: true, canExploreDatasets: true, canExecuteQuery: true, canRefreshDatasets: false },
    expiresAt: new Date(Date.now() + 600_000).toISOString(),
  } });
  try {
    const operations = createNavigationOperations(runtime);
    const context = runtime.capture();
    const consume = (dates: DateBounds) => operations.consumeNavigationIntent(context, {
      target: "queries", datasetId: "national", generation: context.generation, filters: { dates },
    });
    for (const dates of [{}, { start: "2024-02-29" }, { end: "2026-01-01" }, { start: "0000-02-29" }, { start: "2026-01-01", end: "2026-01-01" }]) {
      expect(consume(dates)).toMatchObject({ ok: true, value: { filters: { dates }, proposedDraft: "SELECT * FROM national" } });
    }
    for (const dates of [{ start: "2100-02-29" }, { end: "2026-04-31" }, { start: "2026-01-02", end: "2026-01-01" }]) {
      expect(consume(dates)).toMatchObject({ ok: false, failure: { kind: "invalid-input" } });
    }
  } finally {
    runtime.dispose();
  }
});
