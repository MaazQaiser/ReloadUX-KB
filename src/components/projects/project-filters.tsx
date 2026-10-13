"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { tagOptions, type TagCatalog } from "@/lib/tag-catalog";
import type { ProjectFilters } from "@/schemas/project-filters";
import type { GridFilterOptions } from "@/server/services/projects";

interface SelectFieldProps {
  name: keyof ProjectFilters;
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  /** What the empty choice means: "Any" for filters, the default order for sort. */
  emptyLabel?: string;
}

function SelectField({ name, label, value, options, emptyLabel = "Any" }: SelectFieldProps) {
  const id = `filter-${name}`;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <NativeSelect id={id} name={name} defaultValue={value ?? ""} className="w-full">
        <NativeSelectOption value="">{emptyLabel}</NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}

// Filters tucked behind "More filters"; it opens by itself when one of them is set.
const MORE: (keyof ProjectFilters)[] = ["ai_feature", "flow", "designer", "year", "sort"];

/**
 * One compact row: search, industry and type, with the rest behind "More
 * filters". Filters live in the URL, so results can be bookmarked; dropdowns
 * apply on change, search on Enter. Without JavaScript it is a plain GET form.
 */
export function ProjectFiltersForm({
  filters,
  options,
  catalog,
}: {
  filters: ProjectFilters;
  options: GridFilterOptions;
  catalog: TagCatalog;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const moreCount = MORE.filter((key) => filters[key] !== undefined).length;
  const [showMore, setShowMore] = useState(moreCount > 0);
  const active = Object.values(filters).some((value) => value !== undefined);

  function apply(form: HTMLFormElement) {
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form)) {
      if (typeof value === "string" && value.trim() !== "") params.set(key, value.trim());
    }
    const query = params.toString();
    startTransition(() => router.push(query ? `/projects?${query}` : "/projects"));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apply(event.currentTarget);
  }

  return (
    <form
      ref={formRef}
      action="/projects"
      method="get"
      role="search"
      aria-label="Filter projects"
      aria-busy={pending}
      onSubmit={onSubmit}
      onChange={(event) => {
        if (event.target instanceof HTMLSelectElement && formRef.current) apply(formRef.current);
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_auto] lg:items-end">
        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="filter-q" className="text-xs text-muted-foreground">
            Search
          </Label>
          <Input id="filter-q" name="q" type="search" defaultValue={filters.q} placeholder="Project or client name" maxLength={100} />
        </div>
        <SelectField name="industry" label="Industry" value={filters.industry} options={tagOptions(catalog.industry)} />
        <SelectField name="product_type" label="Type" value={filters.product_type} options={tagOptions(catalog.product_types)} />
        <Button
          type="button"
          variant="outline"
          aria-expanded={showMore}
          aria-controls="more-filters"
          onClick={() => setShowMore((open) => !open)}
          className="sm:col-span-2 lg:col-span-1"
        >
          <SlidersHorizontal aria-hidden />
          More filters{moreCount > 0 && ` (${moreCount})`}
        </Button>
      </div>

      <div id="more-filters" hidden={!showMore} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SelectField name="ai_feature" label="AI feature" value={filters.ai_feature} options={tagOptions(catalog.ai_features)} />
        <SelectField name="flow" label="Flow" value={filters.flow} options={tagOptions(catalog.flows)} />
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
        <SelectField
          name="sort"
          label="Sort"
          value={filters.sort === "least_complete" ? "least_complete" : undefined}
          emptyLabel="Newest delivery"
          options={[{ value: "least_complete", label: "Least complete first" }]}
        />
      </div>

      {/* Enter in the search box submits; without JavaScript this is the way to apply. */}
      <button type="submit" className="sr-only">
        Apply filters
      </button>
      {active && (
        <Link href="/projects" className="self-start text-sm text-soft-foreground underline-offset-4 hover:underline">
          Clear all filters
        </Link>
      )}
    </form>
  );
}
