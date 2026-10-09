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
