import { describe, expect, it } from "vitest";
import { emptyFormValues } from "./project-form";
import { applySuggestion, countSuggested, suggestFromText } from "./fill-from-text";
import { builtInCatalog, mergeCatalog } from "./tag-catalog";

const BRIEF = `Fintua wants a mobile app iOS and a mobile app Android for their fintech customers.
We did UX research and UX/UI design, then a usability testing round. The AI onboarding replaces the old signup.
Figma: https://www.figma.com/design/abc123/Fintua?node-id=1-2 and the dashboard needs reporting.`;

describe("suggestFromText", () => {
  it("picks only tag values whose names appear in the text, in the order they appear", () => {
    const suggestion = suggestFromText(BRIEF, builtInCatalog());

    expect(suggestion.industry).toBe("fintech");
    expect(suggestion.product_types).toEqual(["mobile_app_ios", "mobile_app_android", "dashboard"]);
    expect(suggestion.services).toEqual(["research", "ux_ui_design", "usability_testing"]);
    expect(suggestion.ai_features).toEqual(["ai_onboarding"]);
    expect(suggestion.flows).toEqual(["onboarding", "signup", "dashboard", "reporting"]);
    expect(suggestion.figma_files).toEqual([{ label: "Figma file", url: "https://www.figma.com/design/abc123/Fintua?node-id=1-2" }]);
  });

  it("matches whole words only, so 'hr' doesn't match inside 'three'", () => {
    const suggestion = suggestFromText("Three screens for a legal team.", builtInCatalog());
    expect(suggestion.industry).toBe("legal");
  });

  it("never suggests the 'none' AI feature", () => {
    expect(suggestFromText("No AI here, none at all.", builtInCatalog()).ai_features).toEqual([]);
  });

  it("matches values an admin added", () => {
    const catalog = mergeCatalog([{ list: "industry", key: "real_estate", label: "real estate" }]);
    expect(suggestFromText("A Real Estate listings site.", catalog).industry).toBe("real_estate");
  });

  it("takes the opening sentences as the summary, without links", () => {
    const { summary } = suggestFromText(BRIEF, builtInCatalog());
    expect(summary).toMatch(/^Fintua wants a mobile app iOS/);
    expect(summary).not.toContain("figma.com");
  });

  it("finds nothing in empty text", () => {
    const suggestion = suggestFromText("   ", builtInCatalog());
    expect(countSuggested(suggestion)).toBe(0);
    expect(suggestion.summary).toBeUndefined();
  });

  it("counts filled fields", () => {
    // industry, product types, services, AI features, flows, Figma and summary.
    expect(countSuggested(suggestFromText(BRIEF, builtInCatalog()))).toBe(7);
  });
});

describe("applySuggestion", () => {
  const suggestion = suggestFromText(BRIEF, builtInCatalog());

  it("fills empty fields", () => {
    const filled = applySuggestion(emptyFormValues(), suggestion);
    expect(filled).toMatchObject({ industry: "fintech", ai_features: ["ai_onboarding"], summary: suggestion.summary });
    expect(filled.figma_files).toHaveLength(1);
  });

  it("never overwrites what someone typed, and only adds tag values", () => {
    const typed = {
      ...emptyFormValues(),
      industry: "healthcare",
      summary: "Our own words.",
      flows: ["checkout"],
      figma_files: [{ label: "Main", url: "https://www.figma.com/design/own" }],
    };
    const filled = applySuggestion(typed, suggestion);

    expect(filled.industry).toBe("healthcare");
    expect(filled.summary).toBe("Our own words.");
    expect(filled.flows).toEqual(["checkout", "onboarding", "signup", "dashboard", "reporting"]);
    expect(filled.figma_files).toEqual(typed.figma_files);
  });
});
