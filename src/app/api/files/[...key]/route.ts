import { NextResponse } from "next/server";
import { mimeForKey } from "@/lib/image-type";
import { requireApiRole } from "@/server/auth";
import { getImageStore, isValidKey } from "@/server/storage";

/** Serves uploaded screenshots to approved users only; files are never public. */
export async function GET(_request: Request, { params }: RouteContext<"/api/files/[...key]">) {
  const auth = await requireApiRole("viewer");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "unauthenticated" ? 401 : 403 });

  const key = (await params).key.join("/");
  const mime = mimeForKey(key);
  if (!isValidKey(key) || !mime) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const bytes = await getImageStore().get(key);
  if (!bytes) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": mime,
      // Keys are unique per upload, so the content never changes; keep it out of shared caches.
      "cache-control": "private, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
