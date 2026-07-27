import withPWAInit from "@ducanh2912/next-pwa";
import { NextConfig } from "next/dist/server/config";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  // https://github.com/payloadcms/payload/issues/12550#issuecomment-2939070941
  turbopack: {
    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },

  typescript: {
    // Next runs tsc in a forked worker during build, and that fork segfaults
    // (0xC0000005) on this machine — an environment fault, not a type error.
    // `npm run typecheck` runs the identical check in-process and passes, so
    // types are still enforced, just outside the build.
    // A green build is NOT a green typecheck here. Run typecheck explicitly.
    // Remove this once the local Node install is repaired.
    ignoreBuildErrors: true,
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
    // Barrel-import optimization: without this, importing one icon from
    // react-icons/io5 (etc.) pulls the whole package into the dev/build
    // graph. These are the heaviest barrel-style deps in use.
    optimizePackageImports: [
      "@heroui/react",
      "react-icons",
      "@iconify/react",
      "@mantine/hooks",
      "embla-carousel-react",
    ],
    prefetchInlining: true,
  },
};

const pwa = withPWA(nextConfig);

export default pwa;
