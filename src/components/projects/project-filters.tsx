"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { tagOptions, type TagCatalog } from "@/lib/tag-catalog";
import { hasActiveFilters, projectSearchHref, type ProjectFilters } from "@/schemas/project-filters";
import type { GridFilterOptions } from "@/server/services/projects";

/** Long enough to finish a word, short enough to feel live. */
const SEARCH_DELAY_MS = 400;

// Filters in the side panel; the row keeps only search, industry and type.
const MORE: (keyof ProjectFilters)[] = ["ai_feature", "flow", "designer", "year", "sort"];

interface SelectFieldProps {
  name: keyof ProjectFilters;
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  /** What the empty choice means: "Any" for filters, the default order for sort. */
  emptyLabel?: string;
  /** In the row the label is visually hidden, so the empty choice must say what it filters ("All industries"). */
  compact?: boolean;
}

function SelectField({ name, label, value, options, onChange, emptyLabel = "Any", compact = false }: SelectFieldProps) {
  const id = `filter-${name}`;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id} className={compact ? "sr-only" : "text-xs text-muted-foreground"}>
        {label}
      </Label>
      <NativeSelect id={id} name={name} defaultValue={value ?? ""} onChange={onChange} className="w-full [&_select]:rounded-full">
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

/**
 * One clean row: search, industry, type, "More filters" and Add project.
 * Everything applies as soon as it changes (search after a short pause) and
 * lives in the URL, so results can be bookmarked. Without JavaScript the row
 * is a plain GET form that submits on Enter.
 */
export function ProjectFiltersBar({
  filters,
  options,
  catalog,
  canAdd,
}: {
  filters: ProjectFilters;
  options: GridFilterOptions;
  catalog: TagCatalog;
  canAdd: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreCount = MORE.filter((key) => filters[key] !== undefined).length;
  const active = hasActiveFilters(filters) || filters.sort !== undefined;
  // Remounts the dropdowns after each navigation so they show what the URL says.
  const fieldsKey = JSON.stringify(filters);
  // Search is controlled instead, so a live search can't remount it mid-word;
  // it follows the URL (Clear all, back button) only while you aren't typing in it.
  const [query, setQuery] = useState(filters.q ?? "");
  const [syncedQuery, setSyncedQuery] = useState(filters.q);
  const [typing, setTyping] = useState(false);
  if (filters.q !== syncedQuery) {
    setSyncedQuery(filters.q);
    if (!typing) setQuery(filters.q ?? "");
  }

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  function apply(name: keyof ProjectFilters, raw: string) {
    clearTimeout(searchTimer.current);
    const value = raw.trim();
    const params = new URLSearchParams(projectSearchHref(filters).split("?")[1]);
    if (value) params.set(name, value);
    else params.delete(name);
    const query = params.toString();
    startTransition(() => router.push(query ? `/projects?${query}` : "/projects", { scroll: false }));
  }

  function onSelect(event: ChangeEvent<HTMLSelectElement>) {
    apply(event.target.name as keyof ProjectFilters, event.target.value);
  }

  function onSearch(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setQuery(value);
    clearTimeout(searchTimer.current);
    if (value.trim() === (filters.q ?? "")) return;
    searchTimer.current = setTimeout(() => apply("q", value), SEARCH_DELAY_MS);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apply("q", query);
  }

  return (
    <form
      action="/projects"
      method="get"
      role="search"
      aria-label="Filter projects"
      aria-busy={pending}
      onSubmit={onSubmit}
      className="flex flex-col gap-3 lg:flex-row lg:items-end"
    >
      <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_11rem]">
        <div className="col-span-2 flex flex-col gap-1.5 lg:col-span-1">
          <Label htmlFor="filter-q" className="sr-only">
            Search
          </Label>
          <Input
            id="filter-q"
            name="q"
            type="search"
            value={query}
            onChange={onSearch}
            onFocus={() => setTyping(true)}
            onBlur={() => setTyping(false)}
            placeholder="Search projects or clients"
            maxLength={100}
            className="rounded-full"
          />
        </div>
        <SelectField key={`industry-${fieldsKey}`} compact name="industry" label="Industry" emptyLabel="All industries" value={filters.industry} options={tagOptions(catalog.industry)} onChange={onSelect} />
        <SelectField key={`type-${fieldsKey}`} compact name="product_type" label="Type" emptyLabel="All types" value={filters.product_type} options={tagOptions(catalog.product_types)} onChange={onSelect} />
      </div>

      <div className="flex gap-3">
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" className="flex-1 lg:flex-none">
              <SlidersHorizontal aria-hidden />
              More filters
              {moreCount > 0 && (
                // Inverts with the button, which fills with ink on hover and while the panel is open.
                <span
                  className="grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground transition-colors duration-300 group-hover/button:bg-primary-foreground group-hover/button:text-primary group-aria-expanded/button:bg-primary-foreground group-aria-expanded/button:text-primary"
                  aria-label={`${moreCount} set`}
                >
                  {moreCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>More filters</SheetTitle>
              <SheetDescription>Results update as you choose.</SheetDescription>
            </SheetHeader>
            <div key={fieldsKey} className="flex flex-col gap-5 overflow-y-auto p-6">
              <SelectField name="ai_feature" label="AI feature" value={filters.ai_feature} options={tagOptions(catalog.ai_features)} onChange={onSelect} />
              <SelectField name="flow" label="Flow" value={filters.flow} options={tagOptions(catalog.flows)} onChange={onSelect} />
              <SelectField
                name="designer"
                label="Designer"
                value={filters.designer}
                options={options.designers.map((person) => ({
                  value: person.id,
                  label: person.active ? person.name : `${person.name} (former)`,
                }))}
                onChange={onSelect}
              />
              <SelectField
                name="year"
                label="Delivered"
                value={filters.year?.toString()}
                options={options.years.map((year) => ({ value: String(year), label: String(year) }))}
                onChange={onSelect}
              />
              <SelectField
                name="sort"
                label="Sort"
                value={filters.sort === "least_complete" ? "least_complete" : undefined}
                emptyLabel="Newest delivery"
                options={[{ value: "least_complete", label: "Least complete first" }]}
                onChange={onSelect}
              />
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button type="button">Show results</Button>
              </SheetClose>
              {active && (
                <Link href={projectSearchHref({ view: filters.view })} onClick={() => setMoreOpen(false)} className="text-sm text-soft-foreground underline-offset-4 hover:underline">
                  Clear all
                </Link>
              )}
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {canAdd && (
          <Link href="/projects/new" className={buttonVariants({ className: "flex-1 lg:flex-none" })}>
            <Plus aria-hidden />
            Add project
          </Link>
        )}
      </div>

      {/* Enter in the search box submits; without JavaScript this is the way to apply. */}
      <button type="submit" className="sr-only">
        Apply search
      </button>
    </form>
  );
}
