import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { AI_FEATURE, FLOW, INDUSTRY, PRODUCT_TYPE, type TagList } from "@/lib/constants";
import type { ProjectFilters } from "@/schemas/project-filters";
import type { GridFilterOptions } from "@/server/services/projects";

interface SelectFieldProps {
  name: keyof ProjectFilters;
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
}

function SelectField({ name, label, value, options }: SelectFieldProps) {
  const id = `filter-${name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect id={id} name={name} defaultValue={value ?? ""} className="w-full">
        <NativeSelectOption value="">Any</NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}

function tagOptions<K extends string>(list: TagList<K>) {
  return list.keys.map((key) => ({ value: key, label: list.labels[key] }));
}

/**
 * A plain GET form: filters live in the URL, so results can be bookmarked
 * and shared, and the form works before any JavaScript loads.
 */
export function ProjectFiltersForm({ filters, options }: { filters: ProjectFilters; options: GridFilterOptions }) {
  return (
    <form action="/projects" method="get" role="search" aria-label="Filter projects" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-q">Search</Label>
        <Input id="filter-q" name="q" type="search" defaultValue={filters.q} placeholder="Project or client name" maxLength={100} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <SelectField name="industry" label="Industry" value={filters.industry} options={tagOptions(INDUSTRY)} />
        <SelectField name="product_type" label="Type" value={filters.product_type} options={tagOptions(PRODUCT_TYPE)} />
        <SelectField name="ai_feature" label="AI feature" value={filters.ai_feature} options={tagOptions(AI_FEATURE)} />
        <SelectField name="flow" label="Flow" value={filters.flow} options={tagOptions(FLOW)} />
        <SelectField
          name="designer"
          label="Designer"
          value={filters.designer}
          options={options.designers.map((person) => ({
            value: person.id,
            label: person.active ? person.name : `${person.name} (former)`,
          }))}
        />
        <SelectField
          name="year"
          label="Delivered"
          value={filters.year?.toString()}
          options={options.years.map((year) => ({ value: String(year), label: String(year) }))}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit">Apply filters</Button>
        <Link href="/projects" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Clear
        </Link>
      </div>
    </form>
  );
}
