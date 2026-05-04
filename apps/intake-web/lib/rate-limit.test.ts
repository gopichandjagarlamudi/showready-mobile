import { describe, expect, it } from "vitest"
import {
  createMemoryRateLimitStore,
  consumeRateLimit,
  getClientIp,
  resetRateLimitStore
} from "./rate-limit"

describe("rate limit utilities", () => {
  it("blocks requests after the fixed window limit and reports retry timing", async () => {
    const store = createMemoryRateLimitStore()
    const first = await consumeRateLimit(store, {
      key: "api:user:agent-1",
      limit: 2,
      windowMs: 60_000,
      now: 1_000
    })
    const second = await consumeRateLimit(store, {
      key: "api:user:agent-1",
      limit: 2,
      windowMs: 60_000,
      now: 2_000
    })
    const blocked = await consumeRateLimit(store, {
      key: "api:user:agent-1",
      limit: 2,
      windowMs: 60_000,
      now: 3_000
    })

    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(true)
    expect(blocked).toMatchObject({
      allowed: false,
      retryAfterSeconds: 58,
      headers: {
        "Retry-After": "58",
        "X-RateLimit-Limit": "2",
        "X-RateLimit-Remaining": "0"
      }
    })

    resetRateLimitStore(store)
    await expect(
      consumeRateLimit(store, {
        key: "api:user:agent-1",
        limit: 2,
        windowMs: 60_000,
        now: 3_000
      })
    ).resolves.toMatchObject({ allowed: true })
  })

  it("uses the first forwarded IP as the client IP", () => {
    expect(
      getClientIp(
        new Request("http://localhost/api/mobile/dashboard", {
          headers: {
            "x-forwarded-for": "203.0.113.10, 198.51.100.7",
            "x-real-ip": "198.51.100.20"
          }
        })
      )
    ).toBe("203.0.113.10")
  })
})
