import type { ProjectFormValues } from "@/schemas/project-form";
import type { CatalogList, TagCatalog } from "./tag-catalog";

/**
 * The preview stand-in for "Fill from text": until Claude reads briefs, it
 * only picks up what is literally in the text, so a suggestion is never a
 * guess. Tag values match when their label (or key) appears as a phrase.
 */
export interface FillSuggestion {
  industry?: string;
  product_types: string[];
  services: string[];
  ai_features: string[];
  flows: string[];
  business_model: string[];
  figma_files: { label: string; url: string }[];
  summary?: string;
}

export const MAX_FILL_TEXT_LENGTH = 20_000;
const MAX_SUMMARY_LENGTH = 400;

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Where the phrase first appears as whole words, ignoring case and spacing; -1 if absent. */
function phraseIndex(text: string, phrase: string): number {
  const words = phrase.trim().split(/[\s_]+/).map(escape).join("[\\s_-]+");
  const match = new RegExp(`(?<![\\w])${words}(?![\\w])`, "i").exec(text);
  return match ? match.index : -1;
}

/** Keys whose label or key appears in the text, in the order they first appear. */
function matchList(text: string, list: CatalogList): string[] {
  return list.keys
    .map((key) => {
      const positions = [phraseIndex(text, list.labels[key] ?? key), phraseIndex(text, key)].filter((index) => index >= 0);
      return { key, at: positions.length > 0 ? Math.min(...positions) : -1 };
    })
    .filter((match) => match.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((match) => match.key);
}

function firstSentences(text: string): string | undefined {
  const flat = text.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  if (!flat) return undefined;
  const sentences = flat.match(/[^.!?]+[.!?]+/g) ?? [flat];
  let summary = "";
  for (const sentence of sentences) {
    if ((summary + sentence).length > MAX_SUMMARY_LENGTH) break;
    summary += sentence;
    if (summary.length > 120) break;
  }
  return (summary || flat.slice(0, MAX_SUMMARY_LENGTH)).trim();
}

function figmaLinks(text: string): { label: string; url: string }[] {
  const urls = [...new Set(text.match(/https:\/\/(?:www\.)?figma\.com\/[^\s)>"']+/g) ?? [])];
  return urls.map((url, index) => ({ label: urls.length > 1 ? `Figma file ${index + 1}` : "Figma file", url }));
}

export function suggestFromText(text: string, catalog: TagCatalog): FillSuggestion {
  const source = text.slice(0, MAX_FILL_TEXT_LENGTH);
  return {
    industry: matchList(source, catalog.industry)[0],
    product_types: matchList(source, catalog.product_types),
    services: matchList(source, catalog.services),
    // "none" is a deliberate answer someone gives, not something to read into a brief.
    ai_features: matchList(source, catalog.ai_features).filter((key) => key !== "none"),
    flows: matchList(source, catalog.flows),
    business_model: matchList(source, catalog.business_model),
    figma_files: figmaLinks(source),
    summary: firstSentences(source),
  };
}

/** How many fields a suggestion would fill, for the "found N things" message. */
export function countSuggested(suggestion: FillSuggestion): number {
  const lists = [
    suggestion.product_types,
    suggestion.services,
    suggestion.ai_features,
    suggestion.flows,
    suggestion.business_model,
    suggestion.figma_files,
  ];
  return lists.filter((list) => list.length > 0).length + (suggestion.industry ? 1 : 0) + (suggestion.summary ? 1 : 0);
}

const union = (current: string[], added: string[]) => [...new Set([...current, ...added])];
const hasRows = (rows: { url: string }[]) => rows.some((row) => row.url.trim() !== "");

/**
 * Fills the form from a suggestion without overwriting anything typed:
 * empty fields take the suggestion, tag lists gain the new values.
 */
export function applySuggestion(values: ProjectFormValues, suggestion: FillSuggestion): ProjectFormValues {
  return {
    ...values,
    industry: values.industry || suggestion.industry || "",
    product_types: union(values.product_types, suggestion.product_types),
    services: union(values.services, suggestion.services),
    ai_features: union(values.ai_features, suggestion.ai_features),
    flows: union(values.flows, suggestion.flows),
    business_model: union(values.business_model, suggestion.business_model),
    figma_files: hasRows(values.figma_files) || suggestion.figma_files.length === 0 ? values.figma_files : suggestion.figma_files,
    summary: values.summary.trim() ? values.summary : (suggestion.summary ?? ""),
  };
}
