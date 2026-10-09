import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

/**
 * An optimistic first gate: no session cookie, straight to sign-in. It only
 * checks the cookie exists; requireRole() verifies it next to the data.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE_NAME)) return NextResponse.next();

  const login = new URL("/login", request.url);
  const { pathname, search } = request.nextUrl;
  if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except sign-in itself, the auth endpoints, and static assets.
  matcher: ["/((?!login|forbidden|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
