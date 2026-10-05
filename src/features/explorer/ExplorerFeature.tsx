"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { NavigationIntent } from "../../contracts/navigation";
import type { SessionState } from "../../contracts/session";
import { Button } from "../../components/atoms/Button";
import { Surface } from "../../components/atoms/Surface";
import { StatusMessage } from "../../components/molecules/StatusMessage";
import { Tabs } from "../../components/molecules/Tabs";
import { ExplorerTemplate } from "../../components/templates/ExplorerTemplate";
import { DatasetCatalog } from "./DatasetCatalog";
import { DatasetHeader } from "./DatasetHeader";
import { DatasetPreview } from "./DatasetPreview";
import { DatasetSchema } from "./DatasetSchema";
import { PreviewFilters } from "./PreviewFilters";
import { useExplorer } from "./useExplorer";
import type { ExplorerControllerOptions } from "./service";

const pendingSession: SessionState = { status: "pending", generation: 0 };
export interface ExplorerFeatureProps extends ExplorerControllerOptions {
  readonly onNavigate?: ((intent: NavigationIntent) => void) | undefined;
  /** In-memory handoff from Overview. Stale or unauthorized context is ignored. */
  readonly intent?: NavigationIntent | null | undefined;
}

export function ExplorerFeature({ onNavigate, intent, ...options }: ExplorerFeatureProps) {
  const { state, controller } = useExplorer(options);
  const session = useSyncExternalStore(options.runtime.subscribe, options.runtime.getSnapshot, () => pendingSession);
  const [tab, setTab] = useState("preview");
  const id = useId();
  const consumed = useRef<NavigationIntent | null>(null);
  useEffect(() => {
    if (!intent || consumed.current === intent || intent.target !== "explorer" || state.catalogStatus !== "ready") return;
    consumed.current = intent;
    if (!options.runtime.isCurrent({ generation: intent.generation }) || !state.catalog.some((dataset) => dataset.id === intent.datasetId)) return;
    controller.select(intent.datasetId, intent.filters);
  }, [controller, intent, options.runtime, state.catalog, state.catalogStatus]);
  if (session.status !== "authenticated") return <StatusMessage title={session.status === "pending" ? "Resolving session" : session.status === "expired" ? "Session expired" : "Sign in to explore datasets"} pending={session.status === "pending"} />;
  const { selected, selection } = state;
  const openSql = onNavigate && session.session.capabilities.canExecuteQuery ? () => {
    const next = controller.sqlIntent();
    if (next && options.runtime.isCurrent({ generation: next.generation })) onNavigate(next);
  } : undefined;
  const preview = selection && selected ? <><PreviewFilters key={JSON.stringify(selection)} dataset={selected} selection={selection} onApply={(filters, size) => { controller.select(selected.id, filters, size); }} /><DatasetPreview state={state} onNext={() => { controller.next(); }} onPrevious={() => { controller.previous(); }} onRestart={() => { controller.restart(); }} /></> : null;
  const schema = state.schemaStatus === "loading" ? <StatusMessage title="Loading schema" pending className="m-3" /> : state.schemaFailure ? <StatusMessage title="Schema unavailable" description={state.schemaFailure.message} tone="warning" className="m-3" actions={<Button variant="secondary" onClick={() => { controller.restart(); }}>Reload dataset</Button>} /> : state.schema ? <DatasetSchema schema={state.schema} /> : null;
  return <ExplorerTemplate
    heading={<><h1 className="text-page-title">Dataset Explorer</h1><p className="mt-2 text-[13px] text-text-muted">Discover authorized datasets, inspect schemas, and preview stored observations.</p></>}
    catalog={state.catalogStatus === "loading" ? <StatusMessage title="Loading authorized datasets" pending /> : <DatasetCatalog datasets={state.catalog} selectedId={selected?.id} onSelect={(datasetId) => { setTab("preview"); controller.select(datasetId); }} />}
    detail={selected ? <Surface><DatasetHeader dataset={selected} onSql={openSql} /><Tabs label="Dataset details" selectedId={`${id}-${tab}`} onSelectionChange={(value) => { setTab(value === `${id}-schema` ? "schema" : "preview"); }} items={[{ id: `${id}-preview`, label: "Preview", content: preview }, { id: `${id}-schema`, label: "Schema", content: schema }]} /></Surface> : state.failure ? <StatusMessage title={state.failure.kind === "forbidden" ? "Dataset access denied" : "Catalog unavailable"} description={state.failure.message} tone="warning" actions={<Button variant="secondary" onClick={() => { controller.retryCatalog(); }}>Reload authorized catalog</Button>} /> : <StatusMessage title="Select an available dataset" />}
  />;
}
