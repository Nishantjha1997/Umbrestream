import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // `images.domains` is removed in Next 16 — remotePatterns only.
    remotePatterns: [{ protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" }],
  },

  typescript: {
    // Next spawns a worker to run tsc during build, and that worker segfaults
    // (0xC0000005) on this machine — an environment fault, not a type error.
    // Standalone `npm run typecheck` runs the same check and passes, so types
    // are still enforced; they're just enforced outside the build.
    // Remove this once the local Node install is repaired.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
