import "server-only";

import { env } from "@/utils/env";
import { TMDB } from "tmdb-ts";

let instance: TMDB | null = null;

// Safe dummy client that throws on actual call/nested invocation rather than property access/inspection.
const getDummyClient = (): TMDB => {
  const throwError = () => {
    throw new Error(
      "TMDB_ACCESS_TOKEN is not set. Add it to your environment " +
        "(Vercel: Project Settings -> Environment Variables; local: .env.local). " +
        "It must NOT have a NEXT_PUBLIC_ prefix.",
    );
  };
  
  const dummy: any = new Proxy(throwError, {
    get(target, prop) {
      if (prop === "then" || typeof prop === "symbol") return undefined;
      return dummy;
    },
  });
  
  return dummy as TMDB;
};

function getClient(): TMDB {
  if (!instance) {
    const token = env.TMDB_ACCESS_TOKEN;
    if (!token) {
      return getDummyClient();
    }
    instance = new TMDB(token);
  }
  return instance;
}

export const tmdb = new Proxy({} as TMDB, {
  get(target, prop, receiver) {
    // Prevent bundlers or React internally checking properties (like Symbol.toStringTag, $$typeof, etc.) from triggering client initialization.
    if (typeof prop === "symbol" || prop === "$$typeof" || prop === "then" || prop === "toJSON" || prop === "toString") {
      return Reflect.get(target, prop, receiver);
    }
    const client = getClient();
    return client[prop as keyof TMDB];
  },
});

