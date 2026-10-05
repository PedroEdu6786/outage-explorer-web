"use client";
import { useEffect } from "react";
import type { NavigationIntent } from "../../contracts/navigation";
import { Button } from "../../components/atoms/Button";
import { Input } from "../../components/atoms/Input";
import { Badge } from "../../components/atoms/Badge";
import { FormField } from "../../components/molecules/FormField";
import { StatusMessage } from "../../components/molecules/StatusMessage";
import { WorkspaceTemplate } from "../../components/templates/WorkspaceTemplate";
import { SchemaBrowser } from "./SchemaBrowser";
import { SqlEditorPanel } from "./SqlEditorPanel";
import { QueryStatus } from "./QueryStatus";
import { QueryResults } from "./QueryResults";
import type { QueriesController, QueriesDependencies } from "./service";
import { useQueries } from "./useQueries";
export interface QueriesFeatureProps extends QueriesDependencies {
  readonly intent?: NavigationIntent | null;
  /** Optional composition-owned lifecycle, retained across route transitions. */
  readonly controller?: QueriesController;
}
export function QueriesFeature(props: QueriesFeatureProps) {
  const { state, controller, session } = useQueries(props);
  useEffect(() => { if (props.intent) controller.receiveIntent(props.intent); }, [controller, props.intent, session.generation]);
  if (session.status !== "authenticated") return <StatusMessage title={session.status === "pending" ? "Resolving session" : session.status === "expired" ? "Session expired" : "Sign-in required"} pending={session.status === "pending"} description="Sign in explicitly to access the SQL workspace." />;
  if (!session.session.capabilities.canExecuteQuery) return <StatusMessage title="Query access denied" tone="warning" description="Your current session cannot execute queries." />;
  const busy = state.activity === "running" || state.activity === "paging";
  return <WorkspaceTemplate heading={<div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-[25px] leading-[1.25] font-[650] tracking-[-.025em]">SQL Workspace</h1><p className="mt-1 text-[13px] text-text-muted">Query authorized outage datasets with read-only SQL.</p></div><Badge tone="success">READ ONLY</Badge></div>} browser={<SchemaBrowser state={state} onSelect={(id) => { void controller.selectDataset(id); }} onReload={() => { void controller.loadCatalog(); }} />} workspace={<div className="grid min-w-0 gap-[9px]">
    {state.handoff && <StatusMessage title="Replace edited draft?" description="Opening a dataset prepares unsent SQL. Your current draft is edited; choose whether to replace it." actions={<><Button onClick={() => { controller.confirmHandoff(); }}>Replace draft</Button><Button variant="secondary" onClick={() => { controller.dismissHandoff(); }}>Keep draft</Button></>} />}
    {state.context && <StatusMessage title="Dataset context prepared" description={`Dataset ${state.context.datasetId}. Supplied filters are context only; they do not constrain the proposed SQL. No query has been executed by this handoff.`} />}
    <SqlEditorPanel draft={state.draft} onChange={(value) => { controller.editDraft(value); }} onRun={() => { void controller.run(); }} busy={busy} disabled={false} />
    <div className="max-w-[290px]"><FormField label="Rows per page for next execution" description="Changing size keeps existing pages fixed. Only a deliberate Run applies the new size.">{(association) => <Input {...association} type="number" min={1} max={props.maximumPageSize} value={state.pageSize} disabled={busy} onChange={(event) => { controller.setPageSize(Number(event.currentTarget.value)); }} />}</FormField></div>
    <QueryStatus state={state} />
    {state.failure && "retainedQuery" in state.failure && state.failure.retainedQuery.pageSize && <Button variant="secondary" disabled={busy} onClick={() => { void controller.recoverPage(); }}>Load retained first page</Button>}
    <QueryResults state={state} onPage={(page) => { void controller.readPage(page); }} />
  </div>} />;
}
