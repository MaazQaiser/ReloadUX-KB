import "server-only";
import type { AnswerProject, AnswerRecord, AnswerVerdict } from "@/schemas/answer";

/**
 * Canned answers for the Ask screen until the agent exists (phase 3). They
 * describe the fictional seed projects only, so links resolve locally and
 * nothing here can be mistaken for a real client.
 */
export interface PreviewAnswer {
  /** Every keyword must appear in the question (lowercased) for this answer to match. */
  keywords: readonly string[];
  verdict: AnswerVerdict | null;
  projects: AnswerProject[];
  records: AnswerRecord[];
  text: string;
}

const example = (label: string, path: string) => ({ label, url: `https://example.com/${path}` });

const CALMLY_CARE: AnswerProject = {
  slug: "calmly-care",
  name: "Calmly Care",
  industry: "healthcare",
  product_types: ["web_app", "cross_platform_app"],
  why: "Healthcare patient app with a symptom-check chatbot",
  links: [example("Figma", "figma/calmly-care"), example("Prototype", "proto/calmly-care")],
};

const LEDGERLY: AnswerProject = {
  slug: "ledgerly",
  name: "Ledgerly",
  industry: "fintech",
  product_types: ["mobile_app_ios", "mobile_app_android"],
  why: "Budgeting app for iOS and Android with AI onboarding",
  links: [example("Figma", "figma/ledgerly"), example("Case study", "case-studies/ledgerly")],
};

const PEOPLEPATH: AnswerProject = {
  slug: "peoplepath-hrms",
  name: "Peoplepath HRMS",
  industry: "hr",
  product_types: ["web_app", "dashboard"],
  why: "HR web app with a reporting dashboard",
  links: [],
};

const CASEBOOK: AnswerProject = {
  slug: "casebook",
  name: "Casebook",
  industry: "legal",
  product_types: ["dashboard", "design_system"],
  why: "Legal case dashboard and its design system",
  links: [],
};

const QUESTLINE: AnswerProject = {
  slug: "questline",
  name: "Questline",
  industry: "gaming",
  product_types: ["branding_only"],
  why: "Gaming client, but branding only, no VR product",
  links: [],
};

const recordOf = ({ slug, name }: AnswerProject): AnswerRecord => ({ slug, name });

export const PREVIEW_ANSWERS: readonly PreviewAnswer[] = [
  {
    keywords: ["health", "chatbot"],
    verdict: "yes",
    projects: [CALMLY_CARE],
    records: [recordOf(CALMLY_CARE)],
    text: "Calmly Care is a patient app for a healthcare client. Its symptom-check chatbot replaced the intake forms and books therapy sessions. Sara Malik led the design, delivered in March 2025. The project is under NDA, so use its public summary in proposals.",
  },
  {
    keywords: ["fintech"],
    verdict: "yes",
    projects: [LEDGERLY],
    records: [recordOf(LEDGERLY)],
    text: "Ledgerly is a budgeting app for iOS and Android. We audited the old signup, then designed an AI-led onboarding and a simpler money dashboard. Hamza Tariq led it, delivered in August 2025.",
  },
  {
    keywords: ["dashboard"],
    verdict: "yes",
    projects: [PEOPLEPATH, CASEBOOK],
    records: [recordOf(PEOPLEPATH), recordOf(CASEBOOK)],
    text: "Two projects fit. Peoplepath HRMS is an HR web app with reporting dashboards. Casebook is a dashboard for a legal team, with its own design system.",
  },
  {
    keywords: ["vr"],
    verdict: "no",
    projects: [QUESTLINE],
    records: [recordOf(QUESTLINE)],
    text: "No VR project is recorded. The closest is Questline, a gaming client, but that work was branding only.",
  },
];

/** Shown for anything else: the preview can't search, so it says so rather than guessing. */
export const PREVIEW_FALLBACK: Omit<PreviewAnswer, "keywords"> = {
  verdict: null,
  projects: [],
  records: [],
  text: "This is a preview of the Ask screen. The agent isn't connected yet, so it can only answer the starter questions. Try one of those to see how answers will look.",
};
