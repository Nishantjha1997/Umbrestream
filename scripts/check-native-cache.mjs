import assert from "node:assert/strict";
import { createNativeCache } from "../src/lib/native/cache.ts";

const cache = createNativeCache();
let calls = 0;
const loader = async () => {
  calls += 1;
  return { calls };
};

const [first, second] = await Promise.all([
  cache.get("same", loader, 60_000),
  cache.get("same", loader, 60_000),
]);
assert.equal(calls, 1);
assert.deepEqual(first, second);
assert.deepEqual(await cache.get("same", loader, 60_000), first);

let failures = 0;
await assert.rejects(
  cache.get("failure", async () => {
    failures += 1;
    throw new Error("temporary");
  }, 60_000),
);
await assert.rejects(
  cache.get("failure", async () => {
    failures += 1;
    throw new Error("temporary");
  }, 60_000),
);
assert.equal(failures, 2);

cache.clear();
assert.deepEqual(await cache.get("same", loader, 60_000), { calls: 2 });
console.log("Native cache dedupe, rejection cleanup, and invalidation checks passed.");
