import type { NextConfig } from "next";

// Static export so the prototype can be hosted on GitHub Pages.
// NEXT_PUBLIC_BASE_PATH is set by the deploy workflow ("/<repo>"); empty for local dev.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Vercel sets VERCEL=1 during its builds. There the app is built the normal Next.js way
// (every page is still prerendered) and served from the domain root, so no export is needed.
const onVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  output: onVercel ? undefined : "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Tailwind v4 is wired through Turbopack (there is no PostCSS config in this project).
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
