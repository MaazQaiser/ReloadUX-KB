"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, useFieldId } from "./fields";

interface Column<K extends string> {
  key: K;
  label: string;
  type?: "text" | "url" | "date";
  placeholder?: string;
}

/**
 * An editable list of small records (links, milestones, metrics). Errors are
 * looked up by path, e.g. "figma_files.1.url".
 */
export function RowList<K extends string>({
  path,
  legend,
  columns,
  rows,
  onChange,
  errors,
  addLabel,
}: {
  path: string;
  legend: string;
  columns: Column<K>[];
  rows: Record<K, string>[];
  onChange: (rows: Record<K, string>[]) => void;
  errors: Record<string, string>;
  addLabel: string;
}) {
  const idFor = useFieldId();
  const blank = Object.fromEntries(columns.map((column) => [column.key, ""])) as Record<K, string>;

  function update(index: number, key: K, value: string) {
    onChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      {rows.map((row, index) => (
        <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-start">
          {columns.map((column) => {
            const cellPath = `${path}.${index}.${column.key}`;
            const error = errors[cellPath];
            const id = idFor(cellPath);
            return (
              <div key={column.key} className="flex flex-1 flex-col gap-1">
                <Label htmlFor={id} className="sr-only">
                  {`${legend} ${index + 1} ${column.label}`}
                </Label>
                <Input
                  id={id}
                  type={column.type ?? "text"}
                  value={row[column.key]}
                  placeholder={column.placeholder ?? column.label}
                  onChange={(event) => update(index, column.key, event.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${id}-error` : undefined}
                />
                <FieldError path={cellPath} error={error} />
              </div>
            );
          })}
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
            aria-label={`Remove ${legend.toLowerCase()} ${index + 1}`}
          >
            Remove
          </Button>
        </div>
      ))}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, blank])}>
          {addLabel}
        </Button>
      </div>
    </fieldset>
  );
}
