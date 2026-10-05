"use client";
import { useState } from "react";
import { Surface } from "../../components/atoms/Surface";
import { Button } from "../../components/atoms/Button";
import { SearchField } from "../../components/molecules/SearchField";
import { StatusMessage } from "../../components/molecules/StatusMessage";
import type { QueryState } from "./query-state";
export function SchemaBrowser({ state, onSelect, onReload }: { readonly state: QueryState; readonly onSelect: (id: string) => void; readonly onReload: () => void }) {
  const [search, setSearch] = useState("");
  const matches = state.catalog.filter((dataset) => `${dataset.sqlName} ${dataset.label}`.toLowerCase().includes(search.toLowerCase()));
  return <Surface as="section" aria-label="Authorized data browser" className="overflow-hidden">
    <div className="flex items-center justify-between border-b border-border p-3"><h2 className="text-[12px] font-bold">DATA BROWSER</h2><span className="text-[11px] text-text-muted">{state.catalog.length} datasets</span></div>
    <div className="border-b border-border p-[9px]"><SearchField label="Search authorized datasets" value={search} onValueChange={setSearch} /></div>
    {state.catalogPending && <StatusMessage title="Loading authorized datasets" pending />}
    {state.metadataFailure && <StatusMessage title="Schema unavailable" description={state.metadataFailure.message} tone="error" actions={<Button variant="secondary" onClick={onReload}>Reload catalog</Button>} />}
    {!state.catalogPending && matches.length === 0 && <p className="p-3 text-[12px]">No authorized datasets match.</p>}
    {matches.map((dataset) => <div key={dataset.id}><button type="button" aria-expanded={state.selectedDataset === dataset.id} onClick={() => { onSelect(dataset.id); }} className="flex min-h-[36px] w-full items-center gap-2 border-b border-border px-3 text-left font-mono text-[11px] hover:bg-surface-muted"><span aria-hidden="true">{state.selectedDataset === dataset.id ? "⌄" : "›"}</span>{dataset.sqlName}</button>
      {state.selectedDataset === dataset.id && <div className="bg-surface-muted p-3">
        {state.schemaPending && <StatusMessage title="Loading schema" pending />}
        {state.schema?.columns.map((column) => <div key={column.id} className="flex flex-wrap justify-between gap-2 py-2 text-[11px]"><span>{column.label}</span><span className="font-mono text-text-muted">{column.sqlType}{column.nullable ? " · nullable" : ""}</span></div>)}
        <p className="mt-2 text-[11px] text-text-muted">Schema labels are a reference; no SQL is inserted or run.</p>
      </div>}
    </div>)}
  </Surface>;
}
