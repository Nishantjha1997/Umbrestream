import assert from "node:assert/strict";
import { beginUpdateCheck, resolveUpdateState, updateError } from "../src/lib/native/update.ts";

const idle = { status: "idle", manifest: null, error: "old error" };
assert.deepEqual(beginUpdateCheck(idle), { status: "checking", manifest: null, error: "" });
assert.equal(resolveUpdateState({ versionCode: 5 }, 4).status, "available");
assert.equal(resolveUpdateState({ versionCode: 4 }, 4).status, "current");
assert.equal(resolveUpdateState({ status: "available", versionCode: 1 }, 4).status, "available");
assert.equal(updateError(idle, new Error("network down")).error, "network down");
assert.equal(updateError(idle, "bad response").error, "Update check failed");
console.log("Native update state transition checks passed.");
