import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const shareButton = await readFile(
  new URL("../src/components/ui/button/ShareButton.tsx", import.meta.url),
  "utf8",
);
const analyticsRoute = await readFile(
  new URL("../src/app/api/analytics/events/route.ts", import.meta.url),
  "utf8",
);
const adminClient = await readFile(
  new URL("../src/utils/supabase/admin.ts", import.meta.url),
  "utf8",
);

assert.equal(
  shareButton.includes("location.hostname"),
  false,
  "ShareButton must not read browser globals during server rendering.",
);
assert.match(
  shareButton,
  /https:\/\/streamfree\.online/,
  "ShareButton must emit the canonical production URL during SSR.",
);
assert.match(
  analyticsRoute,
  /createAdminClient\(\)/,
  "Analytics writes must use the cookie-free admin client.",
);
assert.equal(
  adminClient.includes('from "next/headers"'),
  false,
  "The admin client must never inherit request cookies.",
);
assert.match(
  adminClient,
  /from "@supabase\/supabase-js"/,
  "The admin client must be built directly with supabase-js.",
);

console.log("Production runtime safety checks passed.");
