"use client";

import type { ReactNode } from "react";
import { Input, type InputProps } from "../atoms/Input";
import { Icon } from "../atoms/Icon";
import { FormField } from "./FormField";

type DateInputProps = Omit<InputProps, "id" | "type" | "value" | "defaultValue" | "onChange" | "disabled" | "aria-invalid" | "aria-describedby">;

export interface DateRangeFieldProps {
  label?: string;
  startLabel?: string;
  endLabel?: string;
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  startError?: ReactNode;
  endError?: ReactNode;
  disabled?: boolean;
  startInputProps?: DateInputProps;
  endInputProps?: DateInputProps;
  variant?: "fields" | "compact";
  className?: string;
}

/**
 * Calendar strings pass through unchanged; callers own range/coverage policy.
 * B11: validation color changes ease in (inputs via `motion-field`; the compact
 * container border, whose inputs have none, tints with the same transition).
 */
export function DateRangeField({
  label = "Date range", startLabel = "Start date", endLabel = "End date",
  start, end, onStartChange, onEndChange, startError, endError, disabled = false,
  startInputProps, endInputProps, variant = "fields", className = "",
}: DateRangeFieldProps) {
  const compact = variant === "compact";
  const compactStyle = compact ? { border: 0, background: "transparent", height: "auto", padding: "2px", fontSize: "12px" } : undefined;
  return (
    <fieldset className={`${compact ? "motion-colors flex items-start gap-2 rounded-[7px] border border-border bg-surface px-[10px] py-[7px] shadow-panel has-[[aria-invalid=true]]:border-error" : "grid grid-cols-2 gap-[10px] [@media(width<=480px)]:grid-cols-1"} min-w-0 ${className}`} disabled={disabled}>
      <legend className="sr-only">{label}</legend>
      {compact && <Icon name="calendar" size={16} className="mt-1 text-text-muted [@media(width<=480px)]:hidden" />}
      <FormField label={startLabel} labelVisuallyHidden={compact} error={startError} className="flex-1">
        {(association) => <Input {...startInputProps} {...association} type="date" value={start} disabled={disabled} onChange={(event) => { onStartChange(event.currentTarget.value); }} style={{ ...compactStyle, ...startInputProps?.style }} />}
      </FormField>
      {compact && <span aria-hidden="true" className="pt-1 text-[11px] text-text-muted [@media(width<=480px)]:hidden">to</span>}
      <FormField label={endLabel} labelVisuallyHidden={compact} error={endError} className="flex-1">
        {(association) => <Input {...endInputProps} {...association} type="date" value={end} disabled={disabled} onChange={(event) => { onEndChange(event.currentTarget.value); }} style={{ ...compactStyle, ...endInputProps?.style }} />}
      </FormField>
    </fieldset>
  );
}
