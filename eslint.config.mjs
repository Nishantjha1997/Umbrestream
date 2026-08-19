import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * ESLint flat config.
 *
 * There was no eslint config in the repo at all, so `npm run lint` exited
 * without checking anything — and `npm run verify` chained it, so verify was
 * quietly weaker than it looked. Next 16 also removed the `next lint` command,
 * so this runs through the ESLint CLI directly.
 *
 * `eslint-config-next@16` exports flat config from its `./core-web-vitals` and
 * `./typescript` subpaths, so these are imported directly. Do NOT reach for
 * `FlatCompat` here: routing this config through the eslintrc bridge throws
 * "Converting circular structure to JSON" while validating the React plugin.
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "android/**",
      "android-tv/**",
      "mobile/app.bundle.js",
      "tv/app.bundle.js",
      "docs/design/**",
      "next-env.d.ts",
      "public/sw.js",
      "public/workbox-*.js",
    ],
  },
  {
    rules: {
      // Remote poster art renders through HeroUI's <Image> and plain <img> on
      // purpose: there is no next/image usage anywhere and no
      // images.remotePatterns configured, so the optimizer is not in the path.
      // Warn so it stays visible without failing the build.
      "@next/next/no-img-element": "warn",

      // Underscore prefix is the conventional "intentionally ignored".
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // These diagnostics are not actionable for the current libraries and
      // rendering architecture: Embla exposes imperative refs by design,
      // React Hook Form's watch API is intentionally incompatible with the
      // compiler memoizer, and a few hydration effects synchronize browser
      // state after mount. Keep the useful dependency and type rules active.
      "react-hooks/refs": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
