"use client";

import { useId } from "react";
import { Button } from "../../components/atoms/Button";
import { Checkbox } from "../../components/atoms/Checkbox";

export interface ChartZoomControlsProps {
  readonly enabled: boolean;
  readonly rangeLabel: string;
  readonly canZoomIn: boolean;
  readonly canZoomOut: boolean;
  readonly interactive?: boolean;
  readonly onEnabledChange: (enabled: boolean) => void;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onReset: () => void;
}

/** Controlled feature composition; dates, viewport state and data remain with the caller. */
export function ChartZoomControls({
  enabled,
  rangeLabel,
  canZoomIn,
  canZoomOut,
  interactive = true,
  onEnabledChange,
  onZoomIn,
  onZoomOut,
  onReset,
}: ChartZoomControlsProps) {
  const helpId = useId();
  return (
    <div role="group" aria-label="Chart zoom controls" className="grid min-w-0 gap-2 text-[12px]">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-h-[var(--control-height)] cursor-pointer items-center gap-2">
          <Checkbox
            checked={enabled}
            disabled={!interactive}
            aria-describedby={helpId}
            onChange={(event) => { onEnabledChange(event.currentTarget.checked); }} />
          Zoom mode
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" aria-label="Zoom in"
            disabled={!interactive || !enabled || !canZoomIn} onClick={onZoomIn}>+</Button>
          <Button variant="secondary" aria-label="Zoom out"
            disabled={!interactive || !enabled || !canZoomOut} onClick={onZoomOut}>−</Button>
          <Button variant="secondary" disabled={!interactive} onClick={onReset}>Reset zoom</Button>
        </div>
      </div>
      <p className="text-text-muted">Visible dates: {rangeLabel}</p>
      <p id={helpId} className="text-text-muted">
        {enabled
          ? "Scroll to zoom; scroll sideways or swipe to move. With the chart focused, use + / − to zoom and arrow keys to move."
          : "Enable Zoom mode to inspect a smaller time window. Scrolling currently moves the page."}
      </p>
    </div>
  );
}
