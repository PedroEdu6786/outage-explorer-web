import { Button } from "../../components/atoms/Button";
import { PaginationControls } from "../../components/molecules/PaginationControls";
import { StatusMessage } from "../../components/molecules/StatusMessage";
import { TableSkeleton } from "../../components/molecules/TableSkeleton";
import { DataTable } from "../../components/organisms/DataTable";
import type { ExplorerState } from "./preview-state";

export function DatasetPreview({ state, onNext, onPrevious, onRestart }: { readonly state: ExplorerState; readonly onNext: () => void; readonly onPrevious: () => void; readonly onRestart: () => void }) {
  const page = state.pages[state.pageIndex];
  const pending = state.previewStatus === "loading";
  return <div aria-busy={pending}>
    {pending && <StatusMessage title="Loading preview" pending className="m-3" />}
    {pending && !page && <TableSkeleton rows={Math.min(state.selection?.pageSize ?? 6, 8)} columns={Math.min(state.schema?.columns.length ?? 4, 6)} />}
    {state.failure && <StatusMessage title={state.previewStatus === "expired" ? "Preview expired" : state.failure.kind === "data-unavailable" ? "Published data unavailable" : "Preview unavailable"} description={state.failure.message} tone="warning" className="m-3" actions={<Button variant="secondary" onClick={onRestart}>Restart browsing</Button>} />}
    {page && <><DataTable key={`${page.sequence.snapshotId}-${String(state.pageIndex)}`} loading={pending} data={page.table} caption={`${state.selected?.label ?? "Dataset"} preview`} emptyTitle="No records match these filters" emptyDescription="Change filters or restart browsing." />
      <PaginationControls label="Preview continuation" summary={`${String(page.table.rows.length)} rows on this preview page · Snapshot ${page.sequence.snapshotId}`} disabled={pending || state.previewStatus !== "ready"} previous={{ label: "Previous", onSelect: onPrevious, disabled: state.pageIndex === 0 }} next={{ label: "Next", onSelect: onNext, disabled: page.nextCursor === null && state.pageIndex + 1 >= state.pages.length }} />
    </>}
  </div>;
}
