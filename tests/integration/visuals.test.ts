import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import type { User } from "@/schemas/user";
import { getDb } from "@/server/db/client";
import { getImageStore } from "@/server/storage";
import { getProjectDetail } from "@/server/services/projects";
import { editVisual, getCoverUrls, getProjectGallery, runVisualCommand, searchLibrary, uploadVisuals } from "@/server/services/visuals";
import { createLogger } from "@/server/logger";
import { seedDatabase } from "../../scripts/seed/run";

process.env.UPLOADS_DIR = mkdtempSync(join(tmpdir(), "reloadux-uploads-"));

const editor = { id: "64b7f0c2a1b2c3d4e5f60799", role: "editor" } as User;
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

beforeAll(async () => {
  await (await getDb()).dropDatabase();
  await seedDatabase({ dryRun: false, log: createLogger({ level: "error", write: () => {} }) });
});

describe("visuals", () => {
  it("stores valid images under generated names and refuses the rest", async () => {
    const result = await uploadVisuals(editor, "calmly-care", [
      { name: "home.png", bytes: png },
      { name: "booking.jpg", bytes: jpg },
      { name: "evil.png", bytes: new TextEncoder().encode("<svg onload=alert(1)>") },
    ]);

    expect(result).toEqual({
      ok: true,
      value: [
        { name: "home.png", ok: true },
        { name: "booking.jpg", ok: true },
        { name: "evil.png", ok: false, reason: "isn't a PNG, JPG or WebP image" },
      ],
    });

    const gallery = await getProjectGallery((await getProjectDetail("calmly-care"))!.project.id);
    expect(gallery).toHaveLength(2);
    expect(gallery[0]).toMatchObject({ is_cover: true });
    expect(gallery[0]?.url).toMatch(/^\/api\/files\/projects\/calmly-care\/[a-f0-9-]{36}\.png$/);
    const key = gallery[0]!.url.replace("/api/files/", "");
    expect(Array.from((await getImageStore().get(key)) ?? [])).toEqual(Array.from(png));
    expect((await getProjectDetail("calmly-care"))?.project.visuals).toHaveLength(2);
  });

  it("captions, finds, reorders and removes screenshots", async () => {
    const projectId = (await getProjectDetail("calmly-care"))!.project.id;
    const [first, second] = await getProjectGallery(projectId);
    if (!first || !second) throw new Error("expected two screenshots");

    expect((await editVisual(editor, second.id, { caption: "Booking: pick a therapist", flow: "booking" })).ok).toBe(true);
    expect((await editVisual(editor, second.id, { figma_link: "javascript:alert(1)" })).ok).toBe(false);
    expect((await searchLibrary({ q: "therapist" })).map((visual) => visual.id)).toEqual([second.id]);
    expect(await searchLibrary({ flow: "checkout" })).toEqual([]);

    await runVisualCommand(editor, second.id, "earlier");
    await runVisualCommand(editor, second.id, "cover");
    const reordered = await getProjectGallery(projectId);
    expect(reordered.map((visual) => visual.id)).toEqual([second.id, first.id]);
    expect(reordered.find((visual) => visual.is_cover)?.id).toBe(second.id);

    await runVisualCommand(editor, first.id, "remove");
    expect((await getProjectGallery(projectId)).map((visual) => visual.id)).toEqual([second.id]);
    expect((await getProjectDetail("calmly-care"))?.project.visuals).toEqual([second.id]);
  });

  it("finds cover URLs by slug, skipping projects without a cover or that don't exist", async () => {
    const [cover] = await getProjectGallery((await getProjectDetail("calmly-care"))!.project.id);
    const urls = await getCoverUrls(["calmly-care", "ledgerly", "no-such-project"]);
    expect([...urls]).toEqual([["calmly-care", cover?.url]]);
    expect(await getCoverUrls([])).toEqual(new Map());
  });

  it("keeps screenshots when the project form is saved", async () => {
    const { project } = (await getProjectDetail("calmly-care"))!;
    const { saveProject } = await import("@/server/services/projects");
    await saveProject({ ...project, visuals: [] }, { actor: "system:test", reviewStatus: "approved" });
    expect((await getProjectDetail("calmly-care"))?.project.visuals).toHaveLength(1);
  });
});
