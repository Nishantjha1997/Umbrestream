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

  /**
   * Baseline security headers.
   *
   * Deliberately scoped to directives that cannot break third-party playback:
   *
   * - `frame-ancestors 'none'` + `X-Frame-Options: DENY` stop *us* from being
   *   framed (clickjacking / UI redress over the player and the auth forms).
   * - `object-src 'none'` removes the legacy plugin XSS surface.
   * - `base-uri 'self'` stops an injected `<base>` re-pointing every relative
   *   URL on the page.
   * - `form-action 'self'` stops an injected form posting credentials off-site.
   *
   * NOT set here, on purpose: `script-src`, `style-src`, `frame-src`.
   * A `script-src` tight enough to be worth having needs per-request nonces
   * (middleware territory), and a `frame-src` allowlist would silently break
   * playback the first time a provider changes origin or an operator adds one
   * through PLAYER_DIRECT_SOURCES_JSON / legacy players. Both are follow-ups
   * that need a playback smoke test, not a config one-liner.
   * attribute on the player iframe (src/lib/sources/adapters/embed.ts) is what
   * actually contains a hostile provider today.
   */
  async headers() {
    const csp = [
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            // Autoplay / fullscreen / PiP / EME stay delegable: the player
            // iframe needs them (see IFRAME_CAPABILITIES.allow).
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), usb=(), serial=(), payment=()",
          },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

const pwa = withPWA(nextConfig);

export default pwa;
