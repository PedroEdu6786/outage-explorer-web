import type { DatasetSummary } from "../../contracts/catalog";
import { Badge } from "../../components/atoms/Badge";
import { Button } from "../../components/atoms/Button";
import { Icon } from "../../components/atoms/Icon";
import { grainLabel } from "./DatasetCatalog";

export function DatasetHeader({ dataset, onSql }: { readonly dataset: DatasetSummary; readonly onSql: (() => void) | undefined }) {
  return <header className="flex flex-wrap items-start justify-between gap-5 px-[18px] pt-[18px] pb-5">
    <div><Badge tone="info">{grainLabel(dataset.grain)}</Badge><h2 className="mt-2 text-[20px] leading-tight font-[650]">{dataset.label}</h2><p className="mt-2 text-[11px] text-text-muted">{dataset.description}</p><p className="mt-3 text-[10px] text-text-muted">{dataset.coverage.status === "available" ? `Coverage: ${dataset.coverage.range.start} – ${dataset.coverage.range.end}` : "Published coverage unavailable"}</p></div>
    {onSql && <Button variant="secondary" onClick={onSql}><Icon name="sql" size={14} />Open in SQL Workspace</Button>}
  </header>;
}
