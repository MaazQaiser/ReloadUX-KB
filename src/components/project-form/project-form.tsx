"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";
import {
  createProjectAction,
  updateProjectAction,
  type FormPerson,
  type ProjectActionResult,
} from "@/app/(app)/projects/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PROJECT_STATUS } from "@/lib/constants";
import { applySuggestion } from "@/lib/fill-from-text";
import { tagOptions as catalogOptions, type TagCatalog } from "@/lib/tag-catalog";
import { toSlug } from "@/lib/slug";
import type { LinkField, ProjectFormValues } from "@/schemas/project-form";
import { ChipGroup, fieldId, SelectField, TextAreaField, TextField } from "./fields";
import { FillFromText } from "./fill-from-text";
import { PeopleFields } from "./people-fields";
import { RowList } from "./row-list";

const LINK_FIELDS: { field: LinkField; legend: string; addLabel: string }[] = [
  { field: "figma_files", legend: "Figma files", addLabel: "Add Figma file" },
  { field: "prototype_url", legend: "Prototypes", addLabel: "Add prototype" },
  { field: "live_url", legend: "Live links", addLabel: "Add live link" },
  { field: "case_study_url", legend: "Case studies", addLabel: "Add case study" },
  { field: "drive_folder", legend: "Drive folders", addLabel: "Add Drive folder" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-6 border-t pt-8 lg:grid-cols-[14rem_1fr]">
      <h2 className="text-2xl">{title}</h2>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

type FormProps =
  | { mode: "create"; initial: ProjectFormValues; people: FormPerson[]; catalog: TagCatalog }
  | { mode: "edit"; initial: ProjectFormValues; people: FormPerson[]; catalog: TagCatalog; project: { id: string; slug: string } };

export function ProjectForm(props: FormProps) {
  const router = useRouter();
  const [values, setValues] = useState(props.initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const summaryRef = useRef<HTMLDivElement>(null);

  function set<K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const slug = props.mode === "edit" ? props.project.slug : toSlug(values.name);
  const errorList = Object.entries(errors);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      let result: ProjectActionResult;
      try {
        result =
          props.mode === "edit"
            ? await updateProjectAction(props.project.id, props.project.slug, values)
            : await createProjectAction(values);
      } catch {
        result = { ok: false, message: "Saving failed. Your changes are still here; try again.", errors: {} };
      }
      if (result.ok) {
        router.push(`/projects/${result.slug}`);
        router.refresh();
        return;
      }
      setErrors(result.errors);
      setMessage(result.message);
      // Move focus to the summary so keyboard and screen reader users hear what went wrong.
      requestAnimationFrame(() => summaryRef.current?.focus());
    });
  }

  return (
    // The page header already draws a rule, so the first section skips its own.
    <form onSubmit={submit} noValidate className="flex flex-col gap-8 [&>section:first-of-type]:border-t-0 [&>section:first-of-type]:pt-0">
      {message && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-2xl border border-destructive/50 bg-destructive/5 p-5 text-sm">
          <p className="font-medium text-destructive">{message}</p>
          {errorList.length > 0 && (
            <ul className="mt-2 list-disc pl-5">
              {errorList.map(([path, error]) => (
                <li key={path}>
                  <a href={`#${fieldId(path)}`} className="underline underline-offset-4">
                    {path.replace(/[._]/g, " ")}: {error}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <FillFromText catalog={props.catalog} onApply={(suggestion) => setValues((current) => applySuggestion(current, suggestion))} />

      <Section title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            path="name"
            label="Project name"
            required
            value={values.name}
            onChange={(value) => set("name", value)}
            error={errors.name}
            hint={slug ? `Address: /projects/${slug}${props.mode === "edit" ? " (doesn't change)" : ""}` : undefined}
          />
          <TextField path="client_name" label="Client" value={values.client_name} onChange={(value) => set("client_name", value)} error={errors.client_name} />
          <SelectField path="industry" label="Industry" required value={values.industry} onChange={(value) => set("industry", value as ProjectFormValues["industry"])} options={catalogOptions(props.catalog.industry)} error={errors.industry} />
          <SelectField path="status" label="Status" required value={values.status} onChange={(value) => set("status", value as ProjectFormValues["status"])} options={PROJECT_STATUS.keys.map((key) => ({ value: key, label: PROJECT_STATUS.labels[key] }))} error={errors.status} />
          <TextField path="country" label="Country" value={values.country} onChange={(value) => set("country", value)} error={errors.country} />
          <div className="flex items-center gap-2 pt-6">
            <input id={fieldId("nda")} type="checkbox" checked={values.nda} onChange={(event) => set("nda", event.target.checked)} className="size-4 accent-foreground" />
            <Label htmlFor={fieldId("nda")}>Under NDA (use the client-safe summary outside the team)</Label>
          </div>
        </div>
      </Section>

      <Section title="Type and scope">
        <ChipGroup path="product_types" legend="Product type" required options={catalogOptions(props.catalog.product_types)} selected={values.product_types} onChange={(next) => set("product_types", next)} error={errors.product_types} />
        <ChipGroup path="services" legend="Services" options={catalogOptions(props.catalog.services)} selected={values.services} onChange={(next) => set("services", next)} error={errors.services} />
        <ChipGroup path="ai_features" legend="AI features" options={catalogOptions(props.catalog.ai_features)} selected={values.ai_features} onChange={(next) => set("ai_features", next)} error={errors.ai_features} />
        <ChipGroup path="flows" legend="Flows" options={catalogOptions(props.catalog.flows)} selected={values.flows} onChange={(next) => set("flows", next)} error={errors.flows} />
        <ChipGroup path="business_model" legend="Business model" options={catalogOptions(props.catalog.business_model)} selected={values.business_model} onChange={(next) => set("business_model", next)} error={errors.business_model} />
        <RowList
          path="personas"
          legend="Personas"
          columns={[{ key: "name", label: "Persona", placeholder: "e.g. Finance lead at a mid-size firm" }]}
          rows={values.personas}
          onChange={(rows) => set("personas", rows)}
          errors={errors}
          addLabel="Add persona"
        />
      </Section>

      <Section title="People">
        <PeopleFields values={values} set={set} errors={errors} initialPeople={props.people} />
      </Section>

      <Section title="Timeline">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField path="start_date" label="Start date" type="date" value={values.start_date} onChange={(value) => set("start_date", value)} error={errors.start_date} />
          <TextField path="delivery_date" label="Delivery date" type="date" value={values.delivery_date} onChange={(value) => set("delivery_date", value)} error={errors.delivery_date} />
          <TextField path="duration_weeks" label="Duration (weeks)" type="number" value={values.duration_weeks} onChange={(value) => set("duration_weeks", value)} error={errors.duration_weeks} />
        </div>
        <RowList
          path="milestones"
          legend="Milestones"
          columns={[
            { key: "name", label: "Milestone" },
            { key: "date", label: "Date", type: "date" },
          ]}
          rows={values.milestones}
          onChange={(rows) => set("milestones", rows)}
          errors={errors}
          addLabel="Add milestone"
        />
      </Section>

      <Section title="Links">
        {LINK_FIELDS.map(({ field, legend, addLabel }) => (
          <RowList
            key={field}
            path={field}
            legend={legend}
            columns={[
              { key: "label", label: "Label", placeholder: "e.g. Main file" },
              { key: "url", label: "URL", type: "url", placeholder: "https://" },
            ]}
            rows={values[field]}
            onChange={(rows) => set(field, rows)}
            errors={errors}
            addLabel={addLabel}
          />
        ))}
      </Section>

      <Section title="Story">
        <TextAreaField path="summary" label="Summary" required value={values.summary} onChange={(value) => set("summary", value)} error={errors.summary} hint="What we built, in two or three sentences." />
        <TextAreaField path="challenge" label="Challenge" value={values.challenge} onChange={(value) => set("challenge", value)} error={errors.challenge} />
        <TextAreaField path="what_we_did" label="What we did" value={values.what_we_did} onChange={(value) => set("what_we_did", value)} error={errors.what_we_did} />
        <TextAreaField path="outcomes" label="Outcomes" value={values.outcomes} onChange={(value) => set("outcomes", value)} error={errors.outcomes} />
        <TextAreaField path="testimonial" label="Testimonial" rows={3} value={values.testimonial} onChange={(value) => set("testimonial", value)} error={errors.testimonial} />
        <RowList
          path="metrics"
          legend="Metrics"
          columns={[
            { key: "label", label: "Label", placeholder: "e.g. Signup completion" },
            { key: "value", label: "Value", placeholder: "e.g. +27%" },
          ]}
          rows={values.metrics}
          onChange={(rows) => set("metrics", rows)}
          errors={errors}
          addLabel="Add metric"
        />
      </Section>

      <Section title="Client-safe">
        <TextAreaField path="public_summary" label="Client-safe summary" value={values.public_summary} onChange={(value) => set("public_summary", value)} error={errors.public_summary} hint="No client name or confidential detail. Used in proposals, especially for NDA projects." />
      </Section>

      <Section title="Visuals">
        <p className="text-sm text-muted-foreground">
          {props.mode === "edit"
            ? "Upload and arrange screenshots below the form; they save straight away."
            : "Create the project first, then add screenshots from its edit page."}
        </p>
      </Section>

      <div className="sticky bottom-0 flex items-center gap-4 border-t bg-background/85 py-5 backdrop-blur-md">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : props.mode === "edit" ? "Save changes" : "Create project"}
        </Button>
        <Link href={props.mode === "edit" ? `/projects/${props.project.slug}` : "/projects"} className="text-sm text-soft-foreground hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}
