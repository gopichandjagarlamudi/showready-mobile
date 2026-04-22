import { describe, expect, it, vi } from "vitest"
import { createMobileApiClient } from "../src/mobile-api"
import { MobileApiError } from "../src/errors"

describe("createMobileApiClient", () => {
  it("submits authenticated diagnostics batches", async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({
          acceptedCount: 1,
          rejectedCount: 0,
          rejectedEventIds: []
        }),
        {
          status: 202,
          headers: {
            "content-type": "application/json"
          }
        }
      )
    )

    const client = createMobileApiClient({
      supabase: {} as never,
      apiBaseUrl: "https://example.com",
      getAccessToken: async () => "token-123",
      fetcher
    })

    const payload = {
      events: [
        {
          id: "0c59f42d-ece8-4c07-a4ff-2358a0c1553f",
          sessionId: "session-1",
          deviceId: "device-1",
          occurredAt: "2026-04-21T12:00:00.000Z",
          eventType: "error.handled" as const,
          category: "error" as const,
          severity: "error" as const,
          message: "Unable to restore session.",
          platform: "ios" as const,
          context: {},
          breadcrumbs: [],
          tags: {}
        }
      ]
    }

    await expect(client.submitDiagnostics(payload)).resolves.toEqual({
      acceptedCount: 1,
      rejectedCount: 0,
      rejectedEventIds: []
    })
    expect(fetcher).toHaveBeenCalledWith(
      "https://example.com/api/mobile/diagnostics",
      expect.objectContaining({
        method: "POST",
        headers: expect.any(Headers),
        body: JSON.stringify(payload)
      })
    )

    const firstFetchCall = fetcher.mock.calls[0] as unknown as [string, RequestInit] | undefined
    const headers = firstFetchCall?.[1].headers as Headers
    expect(headers.get("Authorization")).toBe("Bearer token-123")
    expect(headers.get("Content-Type")).toBe("application/json")
  })

  it("reports API request failures through onRequestError before throwing", async () => {
    const onRequestError = vi.fn()
    const fetcher = vi.fn(async () => new Response(null, { status: 500 }))

    const client = createMobileApiClient({
      supabase: {} as never,
      apiBaseUrl: "https://example.com",
      getAccessToken: async () => "token-123",
      fetcher,
      onRequestError
    })

    await expect(client.getDashboardSummary()).rejects.toBeInstanceOf(MobileApiError)
    expect(onRequestError).toHaveBeenCalledWith({
      path: "/api/mobile/dashboard",
      method: "GET",
      status: 500,
      message: "Unable to load dashboard summary."
    })
  })
})
