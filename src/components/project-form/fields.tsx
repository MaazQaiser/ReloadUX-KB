"use client";

import { createContext, use, useId, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Next keeps recently visited pages mounted but hidden, so the add and edit forms
// can both be in the document; a prefix per form keeps their ids, and labels, apart.
const FieldIdPrefix = createContext("field");

/** Gives the fields inside it ids no other form on the page uses. */
export function FieldIds({ children }: { children: ReactNode }) {
  return <FieldIdPrefix value={`field${useId()}`}>{children}</FieldIdPrefix>;
}

/** Stable DOM id for a form path such as "figma_files.0.url", unique to the form it's in. */
export function useFieldId(): (path: string) => string {
  const prefix = use(FieldIdPrefix);
  return (path) => `${prefix}-${path.replace(/\./g, "-")}`;
}

export function FieldError({ path, error }: { path: string; error?: string }) {
  const idFor = useFieldId();
  if (!error) return null;
  return (
    <p id={`${idFor(path)}-error`} className="text-sm text-destructive">
      {error}
    </p>
  );
}

interface FieldProps {
  path: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

function describedBy(id: string, error?: string, hint?: string) {
  const ids = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

function FieldShell({ path, label, error, hint, required, children }: FieldProps & { children: ReactNode }) {
  const idFor = useFieldId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={idFor(path)}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </Label>
      {children}
      {hint && (
        <p id={`${idFor(path)}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldError path={path} error={error} />
    </div>
  );
}

export function TextField({
  value,
  onChange,
  type = "text",
  ...field
}: FieldProps & { value: string; onChange: (value: string) => void; type?: "text" | "date" | "number" | "url" }) {
  const id = useFieldId()(field.path);
  return (
    <FieldShell {...field}>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={field.required}
        aria-invalid={field.error ? true : undefined}
        aria-describedby={describedBy(id, field.error, field.hint)}
        {...(type === "number" && { min: 0, step: "0.5", inputMode: "decimal" as const })}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  value,
  onChange,
  rows = 4,
  ...field
}: FieldProps & { value: string; onChange: (value: string) => void; rows?: number }) {
  const id = useFieldId()(field.path);
  return (
    <FieldShell {...field}>
      <Textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        required={field.required}
        aria-invalid={field.error ? true : undefined}
        aria-describedby={describedBy(id, field.error, field.hint)}
      />
    </FieldShell>
  );
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder = "Choose…",
  ...field
}: FieldProps & {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const id = useFieldId()(field.path);
  return (
    <FieldShell {...field}>
      <NativeSelect
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={field.required}
        aria-invalid={field.error ? true : undefined}
        aria-describedby={describedBy(id, field.error, field.hint)}
        className="w-full"
      >
        <NativeSelectOption value="">{placeholder}</NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </FieldShell>
  );
}


/** Multi-select tags as checkbox chips: real checkboxes, so keyboard and screen readers work as expected. */
export function ChipGroup<K extends string>({
  path,
  legend,
  options,
  selected,
  onChange,
  error,
  required,
}: {
  path: string;
  legend: string;
  options: { value: K; label: string }[];
  selected: readonly K[];
  onChange: (next: K[]) => void;
  error?: string;
  required?: boolean;
}) {
  function toggle(value: K, checked: boolean) {
    onChange(checked ? [...selected, value] : selected.filter((item) => item !== value));
  }
  const id = useFieldId()(path);
  return (
    <fieldset
      id={id}
      className="flex flex-col gap-2"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
    >
      <legend className="mb-1.5 text-sm font-medium">
        {legend}
        {required && <span aria-hidden="true"> *</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = selected.includes(option.value);
          return (
            <label
              key={option.value}
              className={cn(
                "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-300 has-focus-visible:ring-4 has-focus-visible:ring-ring/15",
                checked ? "border-primary bg-primary text-primary-foreground shadow-pulse-soft" : "text-foreground/70 hover:bg-muted hover:text-foreground",
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={(event) => toggle(option.value, event.target.checked)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
      <FieldError path={path} error={error} />
    </fieldset>
  );
}
