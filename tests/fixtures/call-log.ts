/** Test-only observable request traces; never import into production composition. */
export type FixtureOperationName =
  | "resolveSession" | "beginLogin" | "logout" | "listDatasets" | "readSchema"
  | "startPreview" | "continuePreview" | "readNationalSeries" | "executeQuery"
  | "readQueryPage" | "consumeNavigationIntent";

export interface FixtureCall {
  readonly id: number;
  readonly operation: FixtureOperationName;
  readonly generation: number;
  readonly input: unknown;
  readonly outcome: "pending" | "success" | "failure" | "rejected";
}

export function createFixtureCallLog() {
  let nextId = 0;
  const calls: FixtureCall[] = [];
  return {
    start(operation: FixtureOperationName, generation: number, input: unknown): number {
      const id = ++nextId;
      calls.push({ id, operation, generation, input: structuredClone(input), outcome: "pending" });
      return id;
    },
    finish(id: number, outcome: FixtureCall["outcome"]) {
      const index = calls.findIndex((call) => call.id === id);
      const call = calls[index];
      if (call) calls[index] = { ...call, outcome };
    },
    read(): readonly FixtureCall[] { return structuredClone(calls); },
    clear() { calls.length = 0; },
  };
}

export type FixtureCallLog = ReturnType<typeof createFixtureCallLog>;
