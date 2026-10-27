import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // e2e runs its own dev server beside yours; a separate build folder keeps them apart.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  cacheComponents: true,
  // PGlite loads WASM and data files from its own package folder; bundling it would break those paths.
  serverExternalPackages: ["@electric-sql/pglite", "@electric-sql/pglite-pgvector"],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
