import { NextResponse, type NextRequest } from "next/server";
import { toNdjsonStream } from "@/lib/ndjson";
import { isSameOrigin } from "@/lib/safe-redirect";
import { askRequestSchema } from "@/schemas/answer";
import { requireApiRole, type ApiAuthError } from "@/server/auth";
import { streamAnswer } from "@/server/services/ask";

const STATUS: Record<ApiAuthError, number> = { unauthenticated: 401, forbidden: 403 };

/** Streams one answer as NDJSON events (see askEventSchema). */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const auth = await requireApiRole("viewer");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: STATUS[auth.error] });

  const body = askRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const events = streamAnswer(body.data.question, auth.value, { signal: request.signal });
  return new Response(toNdjsonStream(events), {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  });
}
