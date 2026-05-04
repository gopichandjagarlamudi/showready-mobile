import type { SupabaseClient } from "@supabase/supabase-js"
import { createSupabaseAdminClient } from "./supabase/admin"

export type RateLimitHeaders = Record<string, string>

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfterSeconds: number
  headers: RateLimitHeaders
}

export type RateLimitStore = {
  consume(input: {
    key: string
    limit: number
    windowMs: number
    now: number
  }): Promise<Pick<RateLimitResult, "allowed" | "remaining" | "resetAt">>
  reset?: () => void
}

type MemoryRateEntry = {
  count: number
  resetAt: number
}

const fallbackMemoryRateLimitStore = createMemoryRateLimitStore()
let defaultRateLimitStore: RateLimitStore | null = null

export function createMemoryRateLimitStore(): RateLimitStore {
  const entries = new Map<string, MemoryRateEntry>()

  return {
    async consume({ key, limit, windowMs, now }) {
      const existing = entries.get(key)

      if (!existing || existing.resetAt <= now) {
        const resetAt = now + windowMs
        entries.set(key, {
          count: 1,
          resetAt
        })
        return {
          allowed: true,
          remaining: Math.max(limit - 1, 0),
          resetAt
        }
      }

      existing.count += 1

      return {
        allowed: existing.count <= limit,
        remaining: Math.max(limit - existing.count, 0),
        resetAt: existing.resetAt
      }
    },
    reset() {
      entries.clear()
    }
  }
}

export function createSupabaseRateLimitStore(client: SupabaseClient<any>): RateLimitStore {
  return {
    async consume({ key, limit, windowMs, now }) {
      const { data, error } = await client.rpc("consume_rate_limit", {
        p_key: key,
        p_limit: limit,
        p_window_ms: windowMs,
        p_now: new Date(now).toISOString()
      })

      if (error) {
        throw error
      }

      const row = Array.isArray(data) ? data[0] : data
      const resetAt = new Date(row.reset_at).getTime()

      return {
        allowed: Boolean(row.allowed),
        remaining: Number(row.remaining ?? 0),
        resetAt
      }
    }
  }
}

function shouldUseSupabaseRateLimitStore() {
  if (process.env.RATE_LIMIT_STORE === "memory") {
    return false
  }

  return process.env.RATE_LIMIT_STORE === "supabase" || process.env.NODE_ENV === "production"
}

export function getDefaultRateLimitStore() {
  if (!defaultRateLimitStore) {
    defaultRateLimitStore = shouldUseSupabaseRateLimitStore()
      ? createSupabaseRateLimitStore(createSupabaseAdminClient())
      : fallbackMemoryRateLimitStore
  }

  return defaultRateLimitStore
}

export function resetRateLimitStore(store: RateLimitStore = getDefaultRateLimitStore()) {
  store.reset?.()
}

export function resetDefaultRateLimitStore() {
  resetRateLimitStore(fallbackMemoryRateLimitStore)
  defaultRateLimitStore = null
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()

  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown"
}

function buildHeaders(input: {
  limit: number
  remaining: number
  resetAt: number
  retryAfterSeconds: number
}) {
  return {
    "Retry-After": String(input.retryAfterSeconds),
    "X-RateLimit-Limit": String(input.limit),
    "X-RateLimit-Remaining": String(input.remaining),
    "X-RateLimit-Reset": String(Math.ceil(input.resetAt / 1000))
  }
}

export async function consumeRateLimit(
  store: RateLimitStore,
  input: {
    key: string
    limit: number
    windowMs: number
    now?: number
  }
): Promise<RateLimitResult> {
  const now = input.now ?? Date.now()
  const result = await store.consume({
    key: input.key,
    limit: input.limit,
    windowMs: input.windowMs,
    now
  })
  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - now) / 1000))

  return {
    ...result,
    retryAfterSeconds,
    headers: buildHeaders({
      limit: input.limit,
      remaining: result.remaining,
      resetAt: result.resetAt,
      retryAfterSeconds
    })
  }
}
