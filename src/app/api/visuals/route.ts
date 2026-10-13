import { NextResponse, type NextRequest } from "next/server";
import { createRateLimiter } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/safe-redirect";
import { slugSchema } from "@/schemas/common";
import { requireApiRole } from "@/server/auth";
import { logger } from "@/server/logger";
import { uploadVisuals } from "@/server/services/visuals";

const MAX_FILES_PER_REQUEST = 10;
// Per editor: generous for a close-out batch, stops runaway scripts.
const allow = createRateLimiter({ limit: 60, windowMs: 60 * 60 * 1000 });

/** Uploads screenshots to a project (multipart: `slug`, one or more `files`). */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const auth = await requireApiRole("editor");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "unauthenticated" ? 401 : 403 });
  if (!allow(auth.value.id)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const form = await request.formData().catch(() => null);
  const slug = slugSchema.safeParse(form?.get("slug"));
  const files = (form?.getAll("files") ?? []).filter((entry): entry is File => entry instanceof File);
  if (!slug.success || files.length === 0 || files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const result = await uploadVisuals(
      auth.value,
      slug.data,
      await Promise.all(files.map(async (file) => ({ name: file.name.slice(0, 200), bytes: new Uint8Array(await file.arrayBuffer()) }))),
    );
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 404 });
    return NextResponse.json({ outcomes: result.value });
  } catch (error) {
    logger.error("visual upload failed", { error, userId: auth.value.id, slug: slug.data });
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
