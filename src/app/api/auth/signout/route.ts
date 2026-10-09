import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { isSameOrigin } from "@/lib/safe-redirect";
import { endSession } from "@/server/auth";

/** Ends the session everywhere and clears the cookie. Posted by the header's sign-out form. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await endSession(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  // 303 so the browser follows with a GET.
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
