import { Surface } from "../../components/atoms/Surface";
import { PanelHeader } from "../../components/molecules/PanelHeader";
import { PaginationControls } from "../../components/molecules/PaginationControls";
import { StatusMessage } from "../../components/molecules/StatusMessage";
import { DataTable } from "../../components/organisms/DataTable";
import type { QueryState } from "./query-state";
export function QueryResults({ state, onPage }: { readonly state: QueryState; readonly onPage: (page: number) => void }) {
  const result = state.result;
  if (!result) return null;
  const count = result.execution.totalPages ?? Math.max(1, Math.ceil(result.execution.retainedRowCount / result.execution.pageSize));
  const busy = state.activity === "running" || state.activity === "paging";
  // Bounded window avoids a huge control list for small configured page sizes.
  const first = Math.max(1, result.page - 2);
  const last = Math.min(count, result.page + 2);
  return <Surface as="section" aria-label="Retained query results" className="overflow-hidden">
    <PanelHeader title="Results" description={<>{result.execution.snapshotId === null ? "Reference-free execution" : <>Snapshot: {result.execution.snapshotId}</>} · {result.execution.retainedRowCount} retained rows · Expires {result.execution.expiresAt}</>} />
    {state.draft !== state.submitted && <StatusMessage title="Results belong to the last submitted statement" description="Your draft has changed. Run explicitly to replace these results." />}
    <details className="border-b border-border px-3 py-2 text-[11px]"><summary>Submitted statement</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap">{state.submitted}</pre></details>
    {result.execution.truncation.truncated && <StatusMessage title="Whole execution truncated" tone="warning" description={`The retained result reached the ${result.execution.truncation.reason} cap. Retained row count is not total source matches.`} />}
    <DataTable key={`${result.execution.queryId}:${String(result.page)}`} loading={state.activity === "paging"} data={result.table} caption="SQL query results" emptyTitle={result.execution.truncation.truncated ? "No rows fit in the retained result" : "Query returned no rows"} emptyDescription={result.execution.truncation.truncated ? "The result was truncated before its first row could be retained. This does not mean the query matched no rows." : "No rows are retained for the submitted statement."} />
    <PaginationControls label="Retained result pages" disabled={busy} summary={`Page ${String(result.page)} of ${String(count)} · Fixed ${String(result.execution.pageSize)} rows per page`} previous={{ label: "Previous", disabled: result.page <= 1, onSelect: () => { onPage(result.page - 1); } }} next={{ label: "Next", disabled: result.page >= count, onSelect: () => { onPage(result.page + 1); } }} pages={Array.from({ length: last - first + 1 }, (_, index) => { const page = first + index; return { key: String(page), label: String(page), current: page === result.page, onSelect: () => { onPage(page); } }; })} />
  </Surface>;
}
