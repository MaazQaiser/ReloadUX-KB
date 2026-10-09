import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { isSameOrigin } from "@/lib/safe-redirect";
import { createSession, SESSION_MAX_AGE_SECONDS } from "@/server/auth";
import type { CreateSessionError } from "@/server/auth/session";

const bodySchema = z.object({ idToken: z.string().min(1).max(8192) });

const STATUS: Record<CreateSessionError, number> = {
  not_configured: 503,
  invalid_token: 401,
  stale_sign_in: 401,
  email_not_allowed: 403,
};

/**
 * Exchanges a fresh Firebase sign-in for a session cookie. This is the one
 * endpoint that runs without a session, because it is how a session starts.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const result = await createSession(body.data.idToken);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: STATUS[result.error] });

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE_NAME, result.value.cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
