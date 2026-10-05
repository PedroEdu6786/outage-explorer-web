import type { DatasetSummary } from "../../contracts/catalog";
import { Surface } from "../../components/atoms/Surface";
import { Badge } from "../../components/atoms/Badge";
import { Icon } from "../../components/atoms/Icon";

export function grainLabel(grain: DatasetSummary["grain"]) {
  return grain === "national" ? "One row per day" : `One row per ${grain} per day`;
}

export function DatasetCatalog({ datasets, selectedId, onSelect }: { readonly datasets: readonly DatasetSummary[]; readonly selectedId: string | undefined; readonly onSelect: (id: string) => void }) {
  return <Surface as="section" aria-label="Available datasets">
    <div className="flex items-center justify-between border-b border-border px-[13px] py-3"><h2 className="text-[11px] font-bold tracking-wide uppercase">Available datasets</h2><Badge>{datasets.length}</Badge></div>
    {datasets.map((dataset) => <button key={dataset.id} type="button" aria-pressed={dataset.id === selectedId} onClick={() => { onSelect(dataset.id); }} className={`block w-full border-b border-border px-[13px] py-3 text-left last:border-b-0 ${dataset.id === selectedId ? "border-l-[3px] border-l-accent bg-surface-active" : "hover:bg-surface-muted"}`}>
      <span className="flex items-center gap-2 text-[11px] font-semibold"><Icon name="table" size={16} className="text-text-muted" />{dataset.label}</span>
      <span className="mt-2 block text-[11px] leading-normal text-text-muted">{dataset.description}</span>
      <span className="mt-3 block text-[9px] text-text-muted uppercase">{grainLabel(dataset.grain)}</span>
    </button>)}
    {datasets.length === 0 && <p className="p-4 text-[12px] text-text-muted">No authorized datasets are available.</p>}
  </Surface>;
}
