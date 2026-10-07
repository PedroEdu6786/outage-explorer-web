import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createSessionRuntime } from "../../src/session/session-runtime";
import { createFixtureOperations } from "../fixtures/operations";
import { FeatureHarness } from "./FeatureHarness";

const runtimes: ReturnType<typeof createSessionRuntime>[] = [];
afterEach(() => { runtimes.splice(0).forEach((runtime) => { runtime.dispose(); }); });
function setup() {
  const fixture = createFixtureOperations();
  const runtime = createSessionRuntime();
  runtime.setResolution(fixture.sessionResolution());
  runtimes.push(runtime);
  render(<FeatureHarness fixture={fixture} runtime={runtime} />);
  return { fixture, runtime };
}
const click = (name: string) => { fireEvent.click(screen.getByRole("button", { name })); };
const calls = (fixture: ReturnType<typeof createFixtureOperations>, operation: string) => fixture.callLog.read().filter((call) => call.operation === operation);
async function ready() { await screen.findByRole("table", { name: "Daily national observations" }); }
function explorer() { return within(screen.getByRole("region", { name: "Explorer feature" })); }
function queries() { return within(screen.getByRole("region", { name: "Queries feature" })); }

describe("four-feature fixture composition", () => {
  it("hands authorized dates through Overview and Explorer, requests edited-draft consent, and keeps one unchanged execution while paging", async () => {
    const { fixture } = setup(); await ready();
    fireEvent.change(screen.getByLabelText("End date", { selector: 'section[aria-label="Overview feature"] input' }), { target: { value: "2026-09-03" } });
    click("Apply dates");
    await waitFor(() => { expect(calls(fixture, "readNationalSeries").at(-1)?.input).toMatchObject({ end: "2026-09-03" }); });
    click("Explore dataset");
    await explorer().findByRole("table", { name: "Synthetic national observations preview" });
    expect(explorer().getByLabelText("End date")).toHaveValue("2026-09-03");
    click("SQL view"); const editor = queries().getByRole("textbox", { name: "SQL statement" });
    fireEvent.change(editor, { target: { value: "SELECT 'edited unsent draft'" } });
    click("Explorer view"); click("Open in SQL Workspace");
    expect(editor).toHaveValue("SELECT 'edited unsent draft'");
    expect(screen.getByText("Replace edited draft?")).toBeVisible();
    expect(calls(fixture, "executeQuery")).toHaveLength(0);
    click("Keep draft"); click("Explorer view"); click("Open in SQL Workspace"); click("Replace draft");
    expect(editor).toHaveValue("SELECT * FROM synthetic_national");
    expect(calls(fixture, "consumeNavigationIntent").at(-1)?.input).toMatchObject({ datasetId: "synthetic-national", filters: { dates: { end: "2026-09-03" } } });
    expect(calls(fixture, "executeQuery")).toHaveLength(0);
    const sql = "  SELECT * FROM synthetic_national;\n";
    fireEvent.change(editor, { target: { value: sql } }); click("Run query");
    await screen.findByText("Query succeeded");
    fireEvent.change(editor, { target: { value: "SELECT 'new unsent draft'" } });
    fireEvent.change(queries().getByLabelText("Rows per page for next execution"), { target: { value: "3" } });
    click("Next"); await screen.findByText("Page 2 of 2 · Fixed 2 rows per page");
    click("Previous"); await screen.findByText("Page 1 of 2 · Fixed 2 rows per page");
    fireEvent(window, new Event("focus")); fireEvent(window, new Event("online"));
    expect(calls(fixture, "executeQuery").map((call) => call.input)).toEqual([{ sql, page: 1, pageSize: 2 }]);
    expect(calls(fixture, "readQueryPage").map((call) => call.input)).toEqual([2, 1].map((page) => ({ queryId: "synthetic-query-1", page, pageSize: 2 })));
    fixture.loseResults(); click("Next"); await screen.findByText("Results lost");
    expect(queries().queryByRole("table")).toBeNull(); expect(calls(fixture, "executeQuery")).toHaveLength(1);
    click("Run query"); await screen.findByText("Query succeeded");
    expect(calls(fixture, "executeQuery").at(-1)?.input).toEqual({ sql: "SELECT 'new unsent draft'", page: 1, pageSize: 3 });
  }, 15_000);

  it.each(["success", "unauthenticated", "forbidden"] as const)("discards delayed metadata, preview, metric and execution %s across Analyst logout then Viewer", async (outcome) => {
    const { fixture, runtime } = setup(); await ready();
    click("Explorer view");
    const schema = fixture.deferNext("readSchema"); const preview = fixture.deferNext("startPreview");
    if (outcome !== "success") {
      fixture.failNext("readSchema", { kind: outcome, message: "Obsolete schema response" });
      fixture.failNext("startPreview", { kind: outcome, message: "Obsolete preview response" });
    }
    fireEvent.click(explorer().getByRole("button", { name: /Synthetic facility observations/ }));
    click("Open in SQL Workspace"); click("Run query"); await screen.findByText("Query succeeded");
    const execution = fixture.deferNext("executeQuery");
    if (outcome !== "success") fixture.failNext("executeQuery", { kind: outcome, message: "Obsolete execution response" });
    click("Run query");
    const catalog = fixture.deferNext("listDatasets"); const metric = fixture.deferNext("readNationalSeries");
    if (outcome !== "success") {
      fixture.failNext("listDatasets", { kind: outcome, message: "Obsolete catalog response" });
      fixture.failNext("readNationalSeries", { kind: outcome, message: "Obsolete metric response" });
    }
    click("Overview view");
    fireEvent.change(screen.getByLabelText("End date", { selector: 'section[aria-label="Overview feature"] input' }), { target: { value: "2026-09-03" } });
    click("Apply dates");
    // Queue an additional late catalog on access change, captured while still Analyst.
    act(() => { runtime.setResolution(fixture.sessionResolution()); });
    click("Sign out");
    await screen.findByRole("heading", { name: "Sign in to your workspace" });
    expect(screen.queryByRole("table", { hidden: true })).toBeNull();
    click("Resolve synthetic Viewer"); await ready();
    await act(async () => { schema.release(); preview.release(); execution.release(); catalog.release(); metric.release(); await Promise.resolve(); });
    expect(runtime.getSnapshot().status).toBe("authenticated");
    click("Explorer view"); await explorer().findByRole("table", { name: "Synthetic national observations preview" });
    expect(screen.queryByText("Synthetic facility observations", { exact: true })).toBeNull();
    expect(screen.queryByText("synthetic_facility", { exact: true })).toBeNull();
    expect(explorer().queryByLabelText("Facility")).toBeNull();
    click("SQL view");
    expect(queries().queryByRole("textbox", { name: "SQL statement" })).toBeNull();
    expect(queries().getByText("Query access denied")).toBeVisible();
    expect(queries().queryByRole("table")).toBeNull();
    expect(screen.queryByText("Replace edited draft?")).toBeNull();
    expect(screen.queryByText("Dataset context prepared")).toBeNull();
    expect(queries().queryByRole("button", { name: "synthetic_national" })).toBeNull();
    expect(queries().queryByRole("button", { name: "synthetic_facility" })).toBeNull();
  });

  it("clears pending edited-draft handoffs and protected results on direct access reduction and unresolved identity", async () => {
    setup(); await ready(); click("SQL view");
    fireEvent.change(queries().getByRole("textbox", { name: "SQL statement" }), { target: { value: "SELECT 'edited'" } });
    click("Run query"); await screen.findByText("Query succeeded");
    click("Explorer view"); fireEvent.click(explorer().getByRole("button", { name: /Synthetic facility observations/ }));
    click("Open in SQL Workspace"); expect(screen.getByText("Replace edited draft?")).toBeVisible();
    click("Resolve synthetic Viewer");
    await waitFor(() => { expect(screen.queryByText("Replace edited draft?")).toBeNull(); });
    expect(queries().queryByRole("textbox", { name: "SQL statement" })).toBeNull();
    expect(queries().getByText("Query access denied")).toBeVisible();
    expect(queries().queryByRole("table")).toBeNull();
    expect(screen.queryByText("synthetic_facility", { exact: true })).toBeNull();
    click("Withhold unresolved session");
    expect(screen.queryByRole("table", { hidden: true })).toBeNull();
    expect(screen.queryByRole("textbox", { name: "SQL statement", hidden: true })).toBeNull();
  });
});
