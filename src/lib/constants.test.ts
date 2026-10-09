import { describe, expect, it } from "vitest";
import {
  AI_FEATURE,
  FLOW,
  INDUSTRY,
  PERSON_ROLE,
  PRODUCT_TYPE,
  PROJECT_STATUS,
  REVIEW_STATUS,
  SERVICE,
} from "./constants";

interface AnyTagList {
  keys: readonly string[];
  labels: Readonly<Record<string, string>>;
}

const lists: [string, AnyTagList][] = Object.entries({
  INDUSTRY,
  PROJECT_STATUS,
  PRODUCT_TYPE,
  SERVICE,
  AI_FEATURE,
  FLOW,
  PERSON_ROLE,
  REVIEW_STATUS,
});

describe("tag lists", () => {
  it.each(lists)("%s keys are snake_case and each has a label", (_name, list) => {
    for (const key of list.keys) {
      expect(key).toMatch(/^[a-z]+(_[a-z]+)*$/);
      expect(list.labels[key]?.trim()).not.toBe("");
    }
    expect(Object.keys(list.labels)).toEqual([...list.keys]);
  });

  it("keeps SPEC.md wording in labels", () => {
    expect(INDUSTRY.labels.saas).toBe("SaaS");
    expect(PRODUCT_TYPE.labels.mobile_app_ios).toBe("mobile app iOS");
    expect(FLOW.labels.content_creation).toBe("posting / content creation");
  });
});
