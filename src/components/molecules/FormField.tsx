"use client";

import { useId, type ReactNode } from "react";

export interface FieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
}

export interface FormFieldProps {
  id?: string;
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  describedBy?: string;
  labelVisuallyHidden?: boolean;
  className?: string;
  children: (props: FieldControlProps) => ReactNode;
}

/** Associates a caller-owned control with its label and supplied help/errors. */
export function FormField({
  id, label, description, error, describedBy, labelVisuallyHidden = false,
  className = "", children,
}: FormFieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hasDescription = description !== undefined && description !== null && description !== "";
  const hasError = error !== undefined && error !== null && error !== "";
  const descriptionIds = [describedBy, hasDescription ? `${controlId}-description` : undefined, hasError ? `${controlId}-error` : undefined].filter(Boolean).join(" ");
  const controlProps: FieldControlProps = {
    id: controlId,
    ...(descriptionIds ? { "aria-describedby": descriptionIds } : {}),
    ...(hasError ? { "aria-invalid": true } : {}),
  };

  return (
    <div className={`grid min-w-0 gap-[5px] ${className}`}>
      <label htmlFor={controlId} className={labelVisuallyHidden ? "sr-only" : "text-[10px] font-semibold text-text-muted"}>{label}</label>
      {children(controlProps)}
      {hasDescription && <p id={`${controlId}-description`} className="text-[11px] text-text-muted">{description}</p>}
      {hasError && <p id={`${controlId}-error`} className="animate-fade-in text-[11px] text-error">{error}</p>}
    </div>
  );
}
