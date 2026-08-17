interface CacheEntry<T> {
  data?: T;
  promise?: Promise<T>;
  at: number;
}

export interface NativeCache {
  get<T>(key: string, loader: () => Promise<T>, ttlMs: number): Promise<T>;
  clear(): void;
}

/**
 * Small in-memory cache shared by the phone and TV shells. It caches resolved
 * values, deduplicates concurrent requests, and removes rejected promises so
 * one transient provider failure cannot poison the session.
 */
export function createNativeCache(): NativeCache {
  const entries = new Map<string, CacheEntry<unknown>>();

  return {
    get<T>(key: string, loader: () => Promise<T>, ttlMs: number) {
      const found = entries.get(key) as CacheEntry<T> | undefined;
      if (found?.data !== undefined && Date.now() - found.at < ttlMs) {
        return Promise.resolve(found.data);
      }
      if (found?.promise) return found.promise;

      const promise = loader()
        .then((data) => {
          entries.set(key, { data, at: Date.now() });
          return data;
        })
        .catch((error: unknown) => {
          entries.delete(key);
          throw error;
        });
      entries.set(key, { promise, at: Date.now() });
      return promise;
    },
    clear() {
      entries.clear();
    },
  };
}
