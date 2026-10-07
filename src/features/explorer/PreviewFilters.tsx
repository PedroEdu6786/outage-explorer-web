"use client";

import { useState } from "react";
import type { DatasetSummary } from "../../contracts/catalog";
import type { PreviewSelection } from "../../contracts/preview";
import { Button } from "../../components/atoms/Button";
import { Input } from "../../components/atoms/Input";
import { DateRangeField } from "../../components/molecules/DateRangeField";
import { FormField } from "../../components/molecules/FormField";
import { validateSelection } from "./preview-state";

export function PreviewFilters({ dataset, selection, onApply }: { readonly dataset: DatasetSummary; readonly selection: PreviewSelection; readonly onApply: (filters: PreviewSelection["filters"], size: number) => void }) {
  const [start, setStart] = useState(selection.filters.dates?.start ?? "");
  const [end, setEnd] = useState(selection.filters.dates?.end ?? "");
  const [facility, setFacility] = useState(selection.filters.facilityId ?? "");
  const supportsFacility = dataset.grain !== "national" && dataset.filters.facilityId;
  const [size, setSize] = useState(String(selection.pageSize));
  const [error, setError] = useState<string | null>(null);
  function apply() {
    const filters: PreviewSelection["filters"] = {
      ...(supportsFacility && facility !== "" ? { facilityId: facility } : {}),
      ...(start || end ? { dates: { ...(start ? { start } : {}), ...(end ? { end } : {}) } } : {}),
    };
    const problem = validateSelection(dataset, { datasetId: dataset.id, filters, pageSize: Number(size) });
    setError(problem);
    if (!problem) onApply(filters, Number(size));
  }
  return <form onSubmit={(event) => { event.preventDefault(); apply(); }} className="motion-colors focus-within:border-accent flex flex-wrap items-end gap-[10px] border-y border-border bg-surface-muted px-[18px] py-[14px] [@media(width<=480px)]:flex-col [@media(width<=480px)]:items-stretch">
    {dataset.filters.dates && <DateRangeField start={start} end={end} onStartChange={setStart} onEndChange={setEnd} />}
    {supportsFacility && <FormField label="Facility ID (optional)">{(association) => <Input {...association} type="text" value={facility} onChange={(event) => { setFacility(event.currentTarget.value); }} autoComplete="off" spellCheck={false} />}</FormField>}
    <FormField label="Rows per page">{(association) => <Input {...association} type="number" min={1} max={500} value={size} onChange={(event) => { setSize(event.currentTarget.value); }} className="max-w-[90px]" />}</FormField>
    <Button type="submit">Apply filters</Button><Button variant="ghost" onClick={() => { setStart(""); setEnd(""); setFacility(""); setSize(String(selection.pageSize)); setError(null); onApply({}, selection.pageSize); }}>Reset</Button>
    {error && <p role="alert" className="w-full text-[11px] text-error">{error}</p>}
  </form>;
}
