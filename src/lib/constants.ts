/**
 * Controlled tag lists. Records store the key; the label is what people see.
 * Labels follow SPEC.md wording. Phase 6 moves these to a database collection
 * seeded from here, so admins can add values in Settings.
 */

/** A non-empty tuple of keys, as z.enum() needs, plus the label for each key. */
export interface TagList<K extends string> {
  keys: readonly [K, ...K[]];
  labels: Readonly<Record<K, string>>;
}

function tagList<const K extends string>(labels: Record<K, string>): TagList<K> {
  // Safe: K is exactly the object's own string keys, and string keys keep insertion order.
  const keys = Object.keys(labels) as [K, ...K[]];
  return { keys, labels };
}

export const INDUSTRY = tagList({
  healthcare: "healthcare",
  fintech: "fintech",
  saas: "SaaS",
  hr: "HR",
  marketing: "marketing",
  ecommerce: "e-commerce",
  education: "education",
  legal: "legal",
  gaming: "gaming",
  other: "other",
});

export const PROJECT_STATUS = tagList({
  ongoing: "ongoing",
  delivered: "delivered",
  paused: "paused",
  cancelled: "cancelled",
});

export const PRODUCT_TYPE = tagList({
  website: "website",
  web_app: "web app",
  mobile_app_ios: "mobile app iOS",
  mobile_app_android: "mobile app Android",
  cross_platform_app: "cross-platform app",
  dashboard: "dashboard",
  design_system: "design system",
  branding_only: "branding only",
});

export const SERVICE = tagList({
  research: "research",
  ux_audit: "UX audit",
  ux_ui_design: "UX/UI design",
  redesign: "redesign",
  branding: "branding",
  prototyping: "prototyping",
  usability_testing: "usability testing",
  dev_handoff: "dev handoff",
  front_end_code: "front-end code",
});

export const AI_FEATURE = tagList({
  chatbot: "chatbot",
  conversational_ai: "conversational AI",
  agentic_workflow: "agentic workflow",
  ai_onboarding: "AI onboarding",
  content_generation: "content generation",
  recommendations: "recommendations",
  ai_search: "AI search",
  none: "none",
});

export const FLOW = tagList({
  onboarding: "onboarding",
  signup: "signup",
  content_creation: "posting / content creation",
  checkout: "checkout",
  dashboard: "dashboard",
  settings: "settings",
  booking: "booking",
  messaging: "messaging",
  reporting: "reporting",
});

export const PERSON_ROLE = tagList({
  designer: "designer",
  account_manager: "account manager",
});

export const REVIEW_STATUS = tagList({
  draft: "draft",
  approved: "approved",
});

/**
 * Ordered from least to most access; see hasRole(). Anyone with a verified
 * Google account can sign in, but starts as "pending" with no access until an
 * admin approves them (SPEC.md decisions log, 2026-10-13).
 */
export const USER_ROLE = tagList({
  pending: "pending approval",
  viewer: "viewer",
  editor: "editor",
  admin: "admin",
});

/** "__session" is the one cookie name Firebase Hosting forwards, so keep it if hosting changes. */
export const SESSION_COOKIE_NAME = "__session";

/** Slugs that would collide with routes under /projects. */
export const RESERVED_PROJECT_SLUGS: readonly string[] = ["new"];

/** How an answer opens (SPEC.md answer rule 1): "partly" means similar but not exact. */
export const ANSWER_VERDICT = tagList({
  yes: "Yes",
  partly: "Partly",
  no: "No",
});

/** Shown on the empty Ask screen so people see the kind of question that works. */
export const STARTER_QUESTIONS: readonly string[] = [
  "Have we done a healthcare chatbot?",
  "Which fintech mobile apps have we designed?",
  "Show me dashboards we've built for HR or legal teams.",
  "Have we built a VR game?",
];

/** Long enough for a pasted brief, short enough to keep a single turn cheap. */
export const MAX_QUESTION_LENGTH = 1000;
export const MAX_FEEDBACK_NOTE_LENGTH = 1000;
