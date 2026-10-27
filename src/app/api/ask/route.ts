import { NextResponse, type NextRequest } from "next/server";
import { toNdjsonStream } from "@/lib/ndjson";
import { ASK_RATE_LIMIT } from "@/lib/constants";
import { createRateLimiter } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/safe-redirect";
import { askRequestSchema } from "@/schemas/answer";
import { requireApiRole, type ApiAuthError } from "@/server/auth";
import { streamAnswer } from "@/server/services/ask";

const STATUS: Record<ApiAuthError, number> = { unauthenticated: 401, forbidden: 403 };

// Each question can cost real money once the agent runs, so one person gets a steady pace, not a burst.
const allowAsk = createRateLimiter({ limit: ASK_RATE_LIMIT.perMinute, windowMs: 60_000 });

/** Streams one answer as NDJSON events (see askEventSchema). */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const auth = await requireApiRole("viewer");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: STATUS[auth.error] });

  const body = askRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  if (!allowAsk(auth.value.id)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const events = streamAnswer(body.data.question, auth.value, { signal: request.signal, history: body.data.history });
  return new Response(toNdjsonStream(events), {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  });
}
