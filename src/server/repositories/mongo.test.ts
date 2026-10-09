import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { CorruptDocumentError, fromDocument, toObjectId, toUpdate } from "./mongo";

describe("toUpdate", () => {
  it("sets defined values and unsets undefined ones", () => {
    expect(toUpdate({ name: "Sara", email: undefined, active: false, roles: [] })).toEqual({
      $set: { name: "Sara", active: false, roles: [] },
      $unset: { email: "" },
    });
  });
});

describe("fromDocument", () => {
  const schema = z.object({ id: z.string(), name: z.string() });
  const _id = new ObjectId("64b7f0c2a1b2c3d4e5f60718");

  it("replaces _id with a hex string id", () => {
    expect(fromDocument(schema, "people", { _id, name: "Sara" })).toEqual({
      id: "64b7f0c2a1b2c3d4e5f60718",
      name: "Sara",
    });
  });

  it("throws a CorruptDocumentError naming the collection and id", () => {
    const error = (() => {
      try {
        fromDocument(schema, "people", { _id, name: 42 });
      } catch (caught) {
        return caught;
      }
    })();
    expect(error).toBeInstanceOf(CorruptDocumentError);
    expect(error).toMatchObject({ collection: "people", documentId: "64b7f0c2a1b2c3d4e5f60718" });
  });
});

describe("toObjectId", () => {
  it("round-trips a hex id", () => {
    expect(toObjectId("64b7f0c2a1b2c3d4e5f60718").toHexString()).toBe("64b7f0c2a1b2c3d4e5f60718");
  });
});
