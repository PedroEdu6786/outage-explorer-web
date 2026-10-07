import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fireEvent, within, waitFor } from "storybook/test";
import { useState } from "react";
import { FixtureProvider, useFixtureController } from "../../../tests/fixtures/FixtureProvider";
import { AppShell } from "../../components/templates/AppShell";
import { Badge } from "../../components/atoms/Badge";
import type { QueryFailure } from "./query-state";
import { SchemaBrowser } from "./SchemaBrowser";
import { initialQueryState } from "./query-state";
import { syntheticCatalog, syntheticSchema } from "../../../tests/fixtures/scenarios";
import { QueriesFeature } from "./QueriesFeature";
function Demo({ failure, holdPage = false, holdRun = false }: { readonly failure?: QueryFailure; readonly holdPage?: boolean; readonly holdRun?: boolean }) {
  const { controller, runtime } = useFixtureController();
  useState(() => { if (failure) controller.failNextExecution(failure); if (holdPage) controller.deferNext("readQueryPage"); if (holdRun) controller.deferNext("executeQuery"); });
  return <AppShell title="SQL Workspace" navigation={{ status: "ready", revision: "synthetic-queries", identity: { name: "Synthetic Analyst", initials: "S", roleLabel: "Analyst" }, destinations: [{ id: "queries", label: "SQL Workspace", href: "#queries", icon: "sql", active: true }] }} accessory={<Badge>Sample data</Badge>} onSignOut={() => { runtime.invalidate(); }}><QueriesFeature operations={controller.operations} runtime={runtime} initialPageSize={2} maximumPageSize={100} /></AppShell>;
}
const meta = { title: "Features/Queries", component: Demo, parameters: { layout: "fullscreen" }, render: () => <FixtureProvider options={{ persona: "analyst" }}><Demo /></FixtureProvider> } satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
const execute: NonNullable<Story["play"]> = async ({ canvasElement }) => { const canvas = within(canvasElement); const editor = await canvas.findByRole("textbox", { name: "SQL statement" }); await fireEvent.change(editor, { target: { value: "SELECT * FROM synthetic_national" } }); await fireEvent.click(canvas.getByRole("button", { name: "Run query" })); await canvas.findByText("Query succeeded"); };
export const Ready: Story = {};
export const ResultsAndDuplicates: Story = { play: execute };
export const ShortTruncatedPage: Story = { render: () => <FixtureProvider options={{ persona: "analyst", dataState: "truncated" }}><Demo /></FixtureProvider>, play: async (context) => { await execute(context); const canvas = within(context.canvasElement); await fireEvent.click(canvas.getByRole("button", { name: "Next" })); await waitFor(() => { if (!canvas.queryByText("Page 2 of 2 · Fixed 2 rows per page")) throw new Error("Waiting for retained page"); }); } };
const executeFailure: NonNullable<Story["play"]> = async ({ canvasElement }) => { const canvas = within(canvasElement); await fireEvent.change(await canvas.findByRole("textbox", { name: "SQL statement" }), { target: { value: "SELECT * FROM synthetic_national" } }); await fireEvent.click(canvas.getByRole("button", { name: "Run query" })); };
export const UnknownOutcome: Story = { render: () => <FixtureProvider options={{ persona: "analyst" }}><Demo failure={{ kind: "unknown-execution-outcome", message: "Synthetic lost response." }} /></FixtureProvider>, play: executeFailure };
export const Busy: Story = { render: () => <FixtureProvider><Demo failure={{ kind: "busy", message: "Synthetic engine busy. Retry deliberately." }} /></FixtureProvider>, play: executeFailure };
export const Timeout: Story = { render: () => <FixtureProvider><Demo failure={{ kind: "execution-timeout", message: "Synthetic deadline exceeded." }} /></FixtureProvider>, play: executeFailure };
export const ResultExpired: Story = { render: () => <FixtureProvider><Demo failure={{ kind: "result-expired", message: "Synthetic retained execution expired. Run explicitly." }} /></FixtureProvider>, play: executeFailure };
export const ResultLost: Story = { render: () => <FixtureProvider><Demo failure={{ kind: "result-lost", message: "Synthetic retained execution lost. Run explicitly." }} /></FixtureProvider>, play: executeFailure };
export const Denied: Story = { render: () => <FixtureProvider><Demo failure={{ kind: "forbidden", message: "Synthetic SQL access denied." }} /></FixtureProvider>, play: executeFailure };
export const Unavailable: Story = { render: () => <FixtureProvider><Demo failure={{ kind: "data-unavailable", message: "Synthetic data unavailable." }} /></FixtureProvider>, play: executeFailure };
export const ServiceFailure: Story = { render: () => <FixtureProvider><Demo failure={{ kind: "service-failure", message: "Synthetic service unavailable." }} /></FixtureProvider>, play: executeFailure };
export const Empty: Story = { render: () => <FixtureProvider options={{ dataState: "empty" }}><Demo /></FixtureProvider>, play: execute };
/** The next retained page is held open: the current result is dimmed, inert and hidden from assistive technology. */
export const Paging: Story = { render: () => <FixtureProvider options={{ persona: "analyst" }}><Demo holdPage /></FixtureProvider>, play: async (context) => { await execute(context); const canvas = within(context.canvasElement); await fireEvent.click(canvas.getByRole("button", { name: "Next" })); await waitFor(() => { if (!context.canvasElement.querySelector("[aria-busy=true][inert]")) throw new Error("Waiting for the dimmed page"); }); } };

export const Running: Story = { render: () => <FixtureProvider options={{ persona: "analyst" }}><Demo holdRun /></FixtureProvider>, play: executeFailure };
export const Copy: Story = { render: () => <FixtureProvider options={{ persona: "analyst" }}><Demo /></FixtureProvider>, play: async ({ canvasElement }) => { const canvas = within(canvasElement); await fireEvent.click(await canvas.findByRole("button", { name: "Copy" })); } };
export const SchemaExpanded: Story = { render: () => <FixtureProvider options={{ persona: "analyst" }}><Demo /></FixtureProvider>, play: async ({ canvasElement }) => { const canvas = within(canvasElement); await fireEvent.click(await canvas.findByRole("button", { name: "synthetic_national" })); await canvas.findByText("Schema labels are a reference; no SQL is inserted or run."); } };

/** Explicit Analyst specimens for feature motion review. */
export const AnalystReady: Story = { render: () => <FixtureProvider options={{ persona: "analyst" }}><Demo /></FixtureProvider> };
export const AnalystResults: Story = { render: () => <FixtureProvider options={{ persona: "analyst" }}><Demo /></FixtureProvider>, play: execute };

/** Controlled component state to review expand-only animation and synchronous collapse; production same-dataset selection still reloads schema. */
function SchemaCollapseReview() {
  const [selected, setSelected] = useState<string | null>(null);
  return <SchemaBrowser state={{ ...initialQueryState(2), catalog: syntheticCatalog, selectedDataset: selected, schema: selected ? syntheticSchema(selected) : null }} onSelect={(id) => { setSelected((value) => value === id ? null : id); }} onReload={() => undefined} />;
}
export const SchemaCollapse: Story = { render: () => <SchemaCollapseReview /> };
