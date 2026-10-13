import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/server/db/client";
import { COLLECTIONS } from "@/server/db/collections";
import { syncIndexes } from "@/server/db/indexes";
import { findUserByFirebaseUid, upsertUserOnSignIn } from "@/server/repositories/users";

const sara = { firebase_uid: "uid-sara", email: "Sara@ReloadUX.com", name: "Sara Malik" };

async function collection() {
  return (await getDb()).collection(COLLECTIONS.users);
}

beforeAll(async () => {
  await syncIndexes(await getDb(), { dryRun: false });
});

beforeEach(async () => {
  await (await collection()).deleteMany({});
});

describe("upsertUserOnSignIn", () => {
  it("creates a pending user on first sign-in with a lowercased email", async () => {
    const user = await upsertUserOnSignIn(sara, { promoteToAdmin: false });

    expect(user).toMatchObject({ firebase_uid: "uid-sara", email: "sara@reloadux.com", role: "pending" });
    expect(user.created_at).toEqual(user.last_sign_in_at);
  });

  it("updates the same user on later sign-ins and keeps their role and created date", async () => {
    const first = await upsertUserOnSignIn(sara, { promoteToAdmin: false });
    await (await collection()).updateOne({ firebase_uid: "uid-sara" }, { $set: { role: "editor" } });

    const second = await upsertUserOnSignIn({ ...sara, name: "Sara M." }, { promoteToAdmin: false });

    expect(second).toMatchObject({ id: first.id, name: "Sara M.", role: "editor" });
    expect(second.created_at).toEqual(first.created_at);
    expect(second.last_sign_in_at.getTime()).toBeGreaterThanOrEqual(first.last_sign_in_at.getTime());
    expect(await (await collection()).countDocuments()).toBe(1);
  });

  it("promotes listed initial admins, new or existing", async () => {
    expect((await upsertUserOnSignIn(sara, { promoteToAdmin: true })).role).toBe("admin");

    await upsertUserOnSignIn({ ...sara, firebase_uid: "uid-ali", email: "ali@reloadux.com" }, { promoteToAdmin: false });
    const promoted = await upsertUserOnSignIn(
      { ...sara, firebase_uid: "uid-ali", email: "ali@reloadux.com" },
      { promoteToAdmin: true },
    );
    expect(promoted.role).toBe("admin");
  });

  it("keeps the same person and role when their Firebase uid changes", async () => {
    const first = await upsertUserOnSignIn(sara, { promoteToAdmin: false });
    await (await collection()).updateOne({ firebase_uid: "uid-sara" }, { $set: { role: "editor" } });

    const again = await upsertUserOnSignIn({ ...sara, firebase_uid: "uid-sara-new-project" }, { promoteToAdmin: false });

    expect(again).toMatchObject({ id: first.id, firebase_uid: "uid-sara-new-project", role: "editor" });
    expect(await findUserByFirebaseUid("uid-sara-new-project")).toMatchObject({ id: first.id });
  });

  it("never demotes an admin", async () => {
    await upsertUserOnSignIn(sara, { promoteToAdmin: true });
    expect((await upsertUserOnSignIn(sara, { promoteToAdmin: false })).role).toBe("admin");
  });
});

describe("findUserByFirebaseUid", () => {
  it("finds a signed-in user and returns null for strangers", async () => {
    await upsertUserOnSignIn(sara, { promoteToAdmin: false });

    expect(await findUserByFirebaseUid("uid-sara")).toMatchObject({ email: "sara@reloadux.com" });
    expect(await findUserByFirebaseUid("uid-nobody")).toBeNull();
  });
});
