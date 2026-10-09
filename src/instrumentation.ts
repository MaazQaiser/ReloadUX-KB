import type { Instrumentation } from "next";

/**
 * Sends unexpected server errors through the shared logger. Headers are left
 * out on purpose: they carry the session cookie.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logger } = await import("@/server/logger");
  logger.error("request failed", {
    error,
    digest: typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined,
    method: request.method,
    path: request.path,
    route: context.routePath,
    routeType: context.routeType,
  });
};
