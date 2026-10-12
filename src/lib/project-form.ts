import type { ValidationIssue } from "./result";
import type { Link } from "@/schemas/common";
import type { Project, ProjectInput } from "@/schemas/project";
import type { ProjectFormValues } from "@/schemas/project-form";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** "" means not set. */
function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** Date inputs give "YYYY-MM-DD"; store UTC midnight so it never shifts a day. */
function toDate(value: string): Date | undefined {
  const day = optional(value);
  if (!day) return undefined;
  // An unparseable value becomes an Invalid Date, which validation reports on the field.
  return ISO_DAY.test(day) ? new Date(`${day}T00:00:00.000Z`) : new Date(Number.NaN);
}

function toDay(date: Date | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

const isBlankRow = (row: Record<string, string>) => Object.values(row).every((value) => value.trim() === "");

function toLinks(rows: ProjectFormValues["figma_files"]): Link[] {
  return rows.filter((row) => !isBlankRow(row)).map((row) => ({ label: row.label.trim(), url: row.url.trim() }));
}

export function emptyFormValues(): ProjectFormValues {
  return {
    name: "",
    client_name: "",
    industry: "",
    country: "",
    status: "",
    nda: false,
    product_types: [],
    services: [],
    ai_features: [],
    flows: [],
    lead_designer: "",
    designers: [],
    account_manager: "",
    delivered_to_name: "",
    delivered_to_role: "",
    start_date: "",
    delivery_date: "",
    duration_weeks: "",
    milestones: [],
    figma_files: [],
    prototype_url: [],
    live_url: [],
    case_study_url: [],
    drive_folder: [],
    summary: "",
    challenge: "",
    what_we_did: "",
    outcomes: "",
    testimonial: "",
    metrics: [],
    public_summary: "",
  };
}

export function toFormValues(project: Project): ProjectFormValues {
  return {
    name: project.name,
    client_name: project.client_name ?? "",
    industry: project.industry,
    country: project.country ?? "",
    status: project.status,
    nda: project.nda,
    product_types: project.product_types,
    services: project.services,
    ai_features: project.ai_features,
    flows: project.flows,
    lead_designer: project.lead_designer,
    designers: project.designers,
    account_manager: project.account_manager ?? "",
    delivered_to_name: project.delivered_to?.name ?? "",
    delivered_to_role: project.delivered_to?.role ?? "",
    start_date: toDay(project.start_date),
    delivery_date: toDay(project.delivery_date),
    duration_weeks: project.duration_weeks?.toString() ?? "",
    milestones: project.milestones.map((milestone) => ({ name: milestone.name, date: toDay(milestone.date) })),
    figma_files: project.figma_files,
    prototype_url: project.prototype_url,
    live_url: project.live_url,
    case_study_url: project.case_study_url,
    drive_folder: project.drive_folder,
    summary: project.summary,
    challenge: project.challenge ?? "",
    what_we_did: project.what_we_did ?? "",
    outcomes: project.outcomes ?? "",
    testimonial: project.testimonial ?? "",
    metrics: project.metrics,
    public_summary: project.public_summary ?? "",
  };
}

/**
 * Turns form values into a project input. It doesn't validate: required
 * fields left empty pass through as empty so the save service reports them.
 */
export function toProjectInput(values: ProjectFormValues, slug: string): ProjectInput {
  const deliveredTo = optional(values.delivered_to_name);
  const duration = optional(values.duration_weeks);
  return {
    name: values.name.trim(),
    slug,
    client_name: optional(values.client_name),
    // Empty selects become values validation rejects, so the field gets an error.
    industry: values.industry as ProjectInput["industry"],
    country: optional(values.country),
    status: values.status as ProjectInput["status"],
    nda: values.nda,
    product_types: values.product_types,
    services: values.services,
    ai_features: values.ai_features,
    flows: values.flows,
    lead_designer: values.lead_designer,
    designers: values.designers,
    account_manager: optional(values.account_manager),
    delivered_to: deliveredTo ? { name: deliveredTo, role: optional(values.delivered_to_role) } : undefined,
    start_date: toDate(values.start_date),
    delivery_date: toDate(values.delivery_date),
    duration_weeks: duration === undefined ? undefined : Number(duration),
    milestones: values.milestones
      .filter((row) => !isBlankRow(row))
      .map((row) => ({ name: row.name.trim(), date: toDate(row.date) ?? new Date(Number.NaN) })),
    figma_files: toLinks(values.figma_files),
    prototype_url: toLinks(values.prototype_url),
    live_url: toLinks(values.live_url),
    case_study_url: toLinks(values.case_study_url),
    drive_folder: toLinks(values.drive_folder),
    summary: values.summary.trim(),
    challenge: optional(values.challenge),
    what_we_did: optional(values.what_we_did),
    outcomes: optional(values.outcomes),
    testimonial: optional(values.testimonial),
    metrics: values.metrics
      .filter((row) => !isBlankRow(row))
      .map((row) => ({ label: row.label.trim(), value: row.value.trim() })),
    public_summary: optional(values.public_summary),
  };
}

/** Field errors keyed by form field (delivered_to.name → delivered_to_name), first message wins. */
export function toFormErrors(issues: ValidationIssue[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const { path, message } of issues) {
    const key = path.replace(/^delivered_to\.(name|role)$/, "delivered_to_$1") || "form";
    errors[key] ??= message;
  }
  return errors;
}
