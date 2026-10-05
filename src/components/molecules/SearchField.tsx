"use client";

import type { ReactNode } from "react";
import { Input, type InputProps } from "../atoms/Input";
import { Icon } from "../atoms/Icon";
import { FormField } from "./FormField";

export type SearchFieldProps = Omit<InputProps, "type" | "value" | "defaultValue" | "onChange" | "aria-invalid"> & {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  description?: ReactNode;
  error?: ReactNode;
  labelVisuallyHidden?: boolean;
};

export function SearchField({
  id, label, value, onValueChange, description, error, labelVisuallyHidden = true,
  "aria-describedby": describedBy, className = "", style, ...props
}: SearchFieldProps) {
  return (
    <FormField {...(id !== undefined ? { id } : {})} label={label} description={description} error={error} labelVisuallyHidden={labelVisuallyHidden} {...(describedBy !== undefined ? { describedBy } : {})}>
      {(association) => (
        <div className="relative">
          <Icon name="search" size={15} className="pointer-events-none absolute left-2 top-2 text-text-muted" />
          <Input {...props} {...association} type="search" value={value} onChange={(event) => { onValueChange(event.currentTarget.value); }} className={className} style={{ paddingLeft: "29px", ...style }} />
        </div>
      )}
    </FormField>
  );
}
