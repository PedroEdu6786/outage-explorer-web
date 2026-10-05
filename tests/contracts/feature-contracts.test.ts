import { createElement } from "react";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReadQueryPageInput } from "../../src/contracts/query";
import { SessionProvider, useSessionState } from "../../src/session/SessionProvider";
import { createSessionRuntime } from "../../src/session/session-runtime";
import { FixtureProvider } from "../fixtures/FixtureProvider";
import { createFixtureOperations } from "../fixtures/operations";
import { syntheticQueryTable } from "../fixtures/scenarios";

function SessionConsumer() {
  const state = useSessionState();
  return createElement("div", null, state.status === "authenticated" ? state.session.identity.displayName : state.status);
}

describe("public feature seams", () => {
  it("withholds identity while pending and removes it immediately on invalidation", () => {
    const runtime = createSessionRuntime();
    const fixture = createFixtureOperations({ persona: "viewer" });
    render(createElement(SessionProvider, { runtime, children: createElement(SessionConsumer) }));
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.queryByText("Synthetic viewer")).not.toBeInTheDocument();
    act(() => { runtime.setResolution(fixture.sessionResolution()); });
    expect(screen.getByText("Synthetic viewer")).toBeInTheDocument();
    act(() => { runtime.invalidate(); });
    expect(screen.queryByText("Synthetic viewer")).not.toBeInTheDocument();
    expect(screen.getByText("unauthenticated")).toBeInTheDocument();
    runtime.dispose();
  });

  it("visibly labels every fixture-provider child as synthetic", () => {
    render(createElement(FixtureProvider, { children: createElement("div", null, "Fixture child") }));
    expect(screen.getByRole("note")).toHaveTextContent("Synthetic fixture demo");
    expect(screen.getByRole("note").parentElement).toContainElement(screen.getByText("Fixture child"));
  });

  it("preserves duplicate columns, duplicate rows, opaque identifiers and exact values", () => {
    expect(syntheticQueryTable.columns.slice(0, 2).map((column) => column.label)).toEqual(["value", "value"]);
    expect(syntheticQueryTable.rows[0]?.cells).toEqual(syntheticQueryTable.rows[1]?.cells);
    expect(syntheticQueryTable.rows[0]?.cells[0]).toEqual({ kind: "integer", exact: "9007199254740993", display: "9007199254740993" });
    expect(syntheticQueryTable.rows[0]?.cells[2]).toEqual({ kind: "identifier", value: "00A7" });
    expect(syntheticQueryTable.columns[0]?.id).not.toBe(syntheticQueryTable.columns[1]?.id);
  });

  it("rejects SQL in the numbered-page contract at compile time", () => {
    const page: ReadQueryPageInput = {
      queryId: "opaque-query",
      page: 2,
      pageSize: 10,
      // @ts-expect-error A retained-page request cannot carry SQL.
      sql: "SELECT must_not_execute",
    };
    expect(page.queryId).toBe("opaque-query");
  });
});
