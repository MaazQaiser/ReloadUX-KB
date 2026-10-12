import { beforeEach, describe, expect, it, vi } from "vitest";
import * as peopleRepository from "@/server/repositories/people";
import { createPerson, savePerson } from "./people";

vi.mock("@/server/repositories/people");

beforeEach(() => {
  vi.resetAllMocks();
});

describe("savePerson", () => {
  it("returns validation issues without writing", async () => {
    const result = await savePerson({ name: "Sara", slug: "Sara Khan", roles: ["designer"] }, "system:seed");

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error.issues.map((issue) => issue.path)).toEqual(["slug"]);
    expect(peopleRepository.upsertPersonBySlug).not.toHaveBeenCalled();
  });

  it("saves valid input with defaults applied", async () => {
    const saved = {
      id: "64b7f0c2a1b2c3d4e5f60718",
      name: "Sara",
      slug: "sara",
      roles: ["designer" as const],
      active: true,
      updated_by: "system:seed",
      updated_at: new Date(),
    };
    vi.mocked(peopleRepository.upsertPersonBySlug).mockResolvedValue(saved);

    const result = await savePerson({ name: "Sara", slug: "sara", roles: ["designer"] }, "system:seed");

    expect(result).toEqual({ ok: true, value: saved });
    expect(peopleRepository.upsertPersonBySlug).toHaveBeenCalledWith(
      { name: "Sara", slug: "sara", roles: ["designer"], active: true },
      "system:seed",
    );
  });
});

describe("createPerson", () => {
  const sara = {
    id: "64b7f0c2a1b2c3d4e5f60718",
    name: "Sara Malik",
    slug: "sara-malik",
    roles: ["designer" as const],
    active: true,
    updated_by: "system:test",
    updated_at: new Date(),
  };

  it("derives the slug from the name and inserts", async () => {
    vi.mocked(peopleRepository.insertPerson).mockResolvedValue(sara);

    expect(await createPerson({ name: "Sara Malik", roles: ["designer"] }, "system:test")).toEqual({ ok: true, value: sara });
    expect(peopleRepository.insertPerson).toHaveBeenCalledWith(
      { name: "Sara Malik", slug: "sara-malik", roles: ["designer"], active: true },
      "system:test",
    );
  });

  it("hands back the existing person when the name is taken", async () => {
    vi.mocked(peopleRepository.insertPerson).mockResolvedValue(null);
    vi.mocked(peopleRepository.findPersonBySlug).mockResolvedValue(sara);

    expect(await createPerson({ name: "sara malik", roles: ["designer"] }, "system:test")).toEqual({
      ok: false,
      error: { kind: "person_exists", person: sara },
    });
  });

  it("refuses a name with nothing usable in it", async () => {
    const result = await createPerson({ name: "!!!", roles: ["designer"] }, "system:test");
    expect(result.ok === false && result.error.kind).toBe("invalid");
  });
});
