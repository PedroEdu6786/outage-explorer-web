"use client";

import { useEffect, useState } from "react";
import type { NationalObservation } from "../../contracts/observations";
import { Button } from "../../components/atoms/Button";
import { Select } from "../../components/atoms/Select";
import { Surface } from "../../components/atoms/Surface";
import { FormField } from "../../components/molecules/FormField";
import { PaginationControls } from "../../components/molecules/PaginationControls";
import { PanelHeader } from "../../components/molecules/PanelHeader";
import { DataTable } from "../../components/organisms/DataTable";
import { observationTable } from "./presentation";

/** `loading` dims retained rows of a superseded range (inert and hidden from assistive technology); the caller owns what is retained. */
export function DailyObservations({ observations, onExplore, loading = false }: { readonly observations: readonly NationalObservation[]; readonly onExplore?: () => void; readonly loading?: boolean }) {
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  useEffect(() => { setPageIndex(0); }, [observations]);
  const pageCount = Math.max(1, Math.ceil(observations.length / pageSize));
  const page = Math.min(pageIndex, pageCount - 1);
  const start = page * pageSize;
  const end = Math.min(start + pageSize, observations.length);
  return <Surface>
    <PanelHeader title="Daily observations" description="Browse observations in the selected range; missing values are unavailable." actions={onExplore && <Button variant="secondary" onClick={onExplore}>Explore dataset</Button>} />
    <div className="border-y border-border bg-surface-muted px-[18px] py-[14px]">
      <FormField label="Rows per page" className="max-w-[100px]">{(association) => <Select {...association} value={pageSize} disabled={loading} onChange={(event) => { setPageSize(Number(event.currentTarget.value)); setPageIndex(0); }}>
        {[10, 20, 50, 100, 500].map((size) => <option key={size} value={size}>{size}</option>)}
      </Select>}</FormField>
    </div>
    <DataTable caption="Daily national observations" loading={loading} data={observationTable(observations.slice(start, end))} missingLabel="Observation unavailable" />
    <PaginationControls label="Daily observations pagination" disabled={loading} summary={`Page ${String(page + 1)} of ${String(pageCount)} · ${observations.length ? `${String(start + 1)}–${String(end)}` : "0"} of ${String(observations.length)} observations`} previous={{ label: "Previous", disabled: page === 0, onSelect: () => { setPageIndex(page - 1); } }} next={{ label: "Next", disabled: page + 1 >= pageCount, onSelect: () => { setPageIndex(page + 1); } }} />
  </Surface>;
}
