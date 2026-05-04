// Persistent cache for ClassifiedIntent results from the LLM classifier.
//
// Backed by the search_intent_cache Supabase table (migration 010). Read/write
// goes through the service-role client, so callers must run on the server
// (API routes, scripts, server components — never the browser).

import { createHash } from "node:crypto";
import type { ClassifiedIntent } from "./types";

// Lazy-load lib/supabase to avoid forcing Supabase client construction at
// module-load time. Importing lib/supabase eagerly creates a client (top-
// level `createClient` call), which throws if NEXT_PUBLIC_SUPABASE_URL is
// not set. The eval script and any caller that only needs memoryCache /
// nullCache should not require Supabase env vars.
async function loadServiceClient() {
  const mod = await import("../supabase");
  return mod.getServiceClient();
}

const TABLE = "search_intent_cache";

/** Normalize for cache key + LLM input: trim, lowercase, collapse whitespace. */
export function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

/** SHA-256 hex of the normalized query. Stable across runs and processes. */
export function hashQuery(q: string): string {
  return createHash("sha256").update(normalizeQuery(q)).digest("hex");
}

export interface CacheReader {
  get(query: string, modelVersion: string): Promise<ClassifiedIntent | null>;
}

export interface CacheWriter {
  put(
    query: string,
    modelVersion: string,
    classification: ClassifiedIntent,
  ): Promise<void>;
}

export type Cache = CacheReader & CacheWriter;

/** Production cache backed by Supabase. */
export function supabaseCache(): Cache {
  return {
    async get(query, modelVersion) {
      const client = await loadServiceClient();
      const { data, error } = await client
        .from(TABLE)
        .select("classification")
        .eq("query_hash", hashQuery(query))
        .eq("model_version", modelVersion)
        .maybeSingle();
      if (error || !data) return null;
      // Touch accessed_at for LRU. Fire-and-forget — a failure here doesn't
      // affect correctness, only future eviction order.
      void client
        .from(TABLE)
        .update({ accessed_at: new Date().toISOString() })
        .eq("query_hash", hashQuery(query))
        .eq("model_version", modelVersion);
      return data.classification as ClassifiedIntent;
    },

    async put(query, modelVersion, classification) {
      const client = await loadServiceClient();
      const { error } = await client.from(TABLE).upsert({
        query_hash: hashQuery(query),
        model_version: modelVersion,
        query: normalizeQuery(query),
        classification,
        confidence: classification.confidence,
      });
      if (error) {
        // Caching is best-effort. Log but don't surface the error to callers
        // — a failed write means we'll re-classify next time, not a wrong
        // answer.
        console.warn("[search-intent] cache write failed:", error.message);
      }
    },
  };
}

/** In-memory cache for tests and local dev. Bounded to avoid leaks. */
export function memoryCache(maxEntries = 500): Cache {
  const store = new Map<string, ClassifiedIntent>();
  const key = (q: string, m: string) => `${m}::${hashQuery(q)}`;
  return {
    async get(query, modelVersion) {
      return store.get(key(query, modelVersion)) ?? null;
    },
    async put(query, modelVersion, classification) {
      if (store.size >= maxEntries) {
        // Drop the oldest entry. Map preserves insertion order.
        const first = store.keys().next().value;
        if (first !== undefined) store.delete(first);
      }
      store.set(key(query, modelVersion), classification);
    },
  };
}

/** No-op cache (every get returns null, every put is a no-op). */
export const nullCache: Cache = {
  async get() {
    return null;
  },
  async put() {
    /* no-op */
  },
};
