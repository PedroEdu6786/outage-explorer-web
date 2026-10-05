"use client";

import { useState } from "react";
import type { DatasetSummary } from "../../contracts/catalog";
import type { PreviewSelection } from "../../contracts/preview";
import { Button } from "../../components/atoms/Button";
import { Input } from "../../components/atoms/Input";
import { Select } from "../../components/atoms/Select";
import { DateRangeField } from "../../components/molecules/DateRangeField";
import { FormField } from "../../components/molecules/FormField";
import { validateSelection } from "./preview-state";

export function PreviewFilters({ dataset, selection, onApply }: { readonly dataset: DatasetSummary; readonly selection: PreviewSelection; readonly onApply: (filters: PreviewSelection["filters"], size: number) => void }) {
  const [start, setStart] = useState(selection.filters.dates?.start ?? "");
  const [end, setEnd] = useState(selection.filters.dates?.end ?? "");
  const [facilityId, setFacility] = useState(selection.filters.facilityId ?? "");
  const [size, setSize] = useState(String(selection.pageSize));
  const [error, setError] = useState<string | null>(null);
  const bounds = dataset.coverage.status === "available" ? { min: dataset.coverage.range.start, max: dataset.coverage.range.end } : {};
  function apply() {
    const filters: PreviewSelection["filters"] = {
      ...(start || end ? { dates: { start, end } } : {}),
      ...(facilityId ? { facilityId } : {}),
    };
    const problem = validateSelection(dataset, { datasetId: dataset.id, filters, pageSize: Number(size) });
    setError(problem);
    if (!problem) onApply(filters, Number(size));
  }
  return <form onSubmit={(event) => { event.preventDefault(); apply(); }} className="flex flex-wrap items-end gap-[10px] border-y border-border bg-surface-muted px-[18px] py-[14px] [@media(width<=480px)]:flex-col [@media(width<=480px)]:items-stretch">
    {dataset.filters.dates && <DateRangeField start={start} end={end} onStartChange={setStart} onEndChange={setEnd} startInputProps={bounds} endInputProps={bounds} />}
    {dataset.filters.facilities.length > 0 && <FormField label="Facility">{(association) => <Select {...association} value={facilityId} onChange={(event) => { setFacility(event.currentTarget.value); }}><option value="">All authorized facilities</option>{dataset.filters.facilities.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</Select>}</FormField>}
    <FormField label="Rows per page">{(association) => <Input {...association} type="number" min={1} max={500} value={size} onChange={(event) => { setSize(event.currentTarget.value); }} className="max-w-[90px]" />}</FormField>
    <Button type="submit">Apply filters</Button><Button variant="ghost" onClick={() => { setStart(""); setEnd(""); setFacility(""); setSize(String(selection.pageSize)); setError(null); onApply({}, selection.pageSize); }}>Reset</Button>
    {error && <p role="alert" className="w-full text-[11px] text-error">{error}</p>}
  </form>;
}
