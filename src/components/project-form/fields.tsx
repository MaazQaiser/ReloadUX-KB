"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { TagList } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Stable DOM id for a form path such as "figma_files.0.url". */
export function fieldId(path: string): string {
  return `field-${path.replace(/\./g, "-")}`;
}

export function FieldError({ path, error }: { path: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${fieldId(path)}-error`} className="text-sm text-destructive">
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

function describedBy(path: string, error?: string, hint?: string) {
  const ids = [error && `${fieldId(path)}-error`, hint && `${fieldId(path)}-hint`].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

function FieldShell({ path, label, error, hint, required, children }: FieldProps & { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId(path)}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </Label>
      {children}
      {hint && (
        <p id={`${fieldId(path)}-hint`} className="text-xs text-muted-foreground">
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
  return (
    <FieldShell {...field}>
      <Input
        id={fieldId(field.path)}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={field.required}
        aria-invalid={field.error ? true : undefined}
        aria-describedby={describedBy(field.path, field.error, field.hint)}
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
  return (
    <FieldShell {...field}>
      <Textarea
        id={fieldId(field.path)}
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        required={field.required}
        aria-invalid={field.error ? true : undefined}
        aria-describedby={describedBy(field.path, field.error, field.hint)}
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
  return (
    <FieldShell {...field}>
      <NativeSelect
        id={fieldId(field.path)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={field.required}
        aria-invalid={field.error ? true : undefined}
        aria-describedby={describedBy(field.path, field.error, field.hint)}
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

export function tagOptions<K extends string>(list: TagList<K>) {
  return list.keys.map((key) => ({ value: key, label: list.labels[key] }));
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
  return (
    <fieldset
      id={fieldId(path)}
      className="flex flex-col gap-2"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${fieldId(path)}-error` : undefined}
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
                "cursor-pointer border px-3 py-1.5 text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
                checked ? "border-primary bg-primary text-primary-foreground" : "border-input text-soft-foreground hover:border-foreground hover:text-foreground",
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
