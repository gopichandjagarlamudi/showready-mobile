import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

const { mockRequireMobileAgent, mockRecordDiagnosticEvents } = vi.hoisted(() => ({
  mockRequireMobileAgent: vi.fn(),
  mockRecordDiagnosticEvents: vi.fn()
}))

vi.mock("@/lib/mobile-auth", () => ({
  MobileAuthError: class MobileAuthError extends Error {
    status: number

    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
  },
  requireMobileAgent: mockRequireMobileAgent
}))

vi.mock("@/lib/supabase/data", () => ({
  recordDiagnosticEvents: mockRecordDiagnosticEvents
}))

describe("POST /api/mobile/diagnostics", () => {
  beforeEach(() => {
    mockRequireMobileAgent.mockReset()
    mockRecordDiagnosticEvents.mockReset()

    mockRequireMobileAgent.mockResolvedValue({
      agentId: "agent-1",
      client: {}
    })

    mockRecordDiagnosticEvents.mockResolvedValue({
      acceptedCount: 1,
      rejectedCount: 0,
      rejectedEventIds: []
    })
  })

  it("stores valid diagnostics events for authenticated agents and redacts blocked fields", async () => {
    const response = await POST(
      new Request("http://localhost/api/mobile/diagnostics", {
        method: "POST",
        headers: {
          authorization: "Bearer token",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          events: [
            {
              id: "0c59f42d-ece8-4c07-a4ff-2358a0c1553f",
              sessionId: "session-1",
              deviceId: "device-1",
              occurredAt: "2026-04-21T12:00:00.000Z",
              eventType: "api.failure",
              category: "api",
              severity: "error",
              message: "Unable to load dashboard summary.",
              platform: "ios",
              screen: "/home",
              requestPath: "/api/mobile/dashboard",
              httpStatus: 500,
              leadId: "lead-1",
              context: {
                route: "/home",
                leadId: "lead-1",
                email: "buyer@example.com",
                authToken: "secret-token",
                notes: "private note"
              },
              breadcrumbs: [
                {
                  timestamp: "2026-04-21T11:59:50.000Z",
                  type: "navigation",
                  message: "Visited /home",
                  data: {
                    route: "/home",
                    phone: "416-555-0101"
                  }
                }
              ]
            }
          ]
        })
      })
    )

    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toEqual({
      acceptedCount: 1,
      rejectedCount: 0,
      rejectedEventIds: []
    })
    expect(mockRecordDiagnosticEvents).toHaveBeenCalledWith(
      {},
      "agent-1",
      expect.arrayContaining([
        expect.objectContaining({
          id: "0c59f42d-ece8-4c07-a4ff-2358a0c1553f",
          leadId: "lead-1",
          requestPath: "/api/mobile/dashboard",
          context: {
            route: "/home",
            leadId: "lead-1"
          },
          breadcrumbs: [
            {
              timestamp: "2026-04-21T11:59:50.000Z",
              type: "navigation",
              message: "Visited /home",
              data: {
                route: "/home"
              }
            }
          ]
        })
      ])
    )
  })

  it("returns 400 for an empty diagnostics batch", async () => {
    const response = await POST(
      new Request("http://localhost/api/mobile/diagnostics", {
        method: "POST",
        headers: {
          authorization: "Bearer token",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          events: []
        })
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Diagnostics batch must contain at least one event."
    })
    expect(mockRecordDiagnosticEvents).not.toHaveBeenCalled()
  })
})
