import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

const {
  mockSubmitIntakeDraft,
  mockCreateSupabaseAdminClient,
  mockSubmitInvite,
  mockGetAgentContext,
  mockListAgentPushTokens,
  mockSendLeadScoredEmail,
  mockSendLeadScoredPushNotifications,
  mockTrackServerEvent,
  mockCaptureServerError
} = vi.hoisted(() => ({
  mockSubmitIntakeDraft: vi.fn(),
  mockCreateSupabaseAdminClient: vi.fn(),
  mockSubmitInvite: vi.fn(),
  mockGetAgentContext: vi.fn(),
  mockListAgentPushTokens: vi.fn(),
  mockSendLeadScoredEmail: vi.fn(),
  mockSendLeadScoredPushNotifications: vi.fn(),
  mockTrackServerEvent: vi.fn(),
  mockCaptureServerError: vi.fn()
}))

vi.mock("@showready/application", () => ({
  submitIntakeDraft: mockSubmitIntakeDraft
}))

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mockCreateSupabaseAdminClient
}))

vi.mock("@/lib/supabase/data", () => ({
  submitInvite: mockSubmitInvite,
  getAgentContext: mockGetAgentContext,
  listAgentPushTokens: mockListAgentPushTokens
}))

vi.mock("@/lib/notifications", () => ({
  sendLeadScoredEmail: mockSendLeadScoredEmail,
  sendLeadScoredPushNotifications: mockSendLeadScoredPushNotifications
}))

vi.mock("@/lib/analytics", () => ({
  trackServerEvent: mockTrackServerEvent
}))

vi.mock("@/lib/observability", () => ({
  captureServerError: mockCaptureServerError
}))

describe("POST /api/intake/[token]/submit", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"
    mockSubmitInvite.mockReset()
    mockGetAgentContext.mockReset()
    mockListAgentPushTokens.mockReset()
    mockSendLeadScoredEmail.mockReset()
    mockSendLeadScoredPushNotifications.mockReset()
    mockTrackServerEvent.mockReset()
    mockCaptureServerError.mockReset()
    mockCreateSupabaseAdminClient.mockReturnValue({ admin: true })
    mockSubmitIntakeDraft.mockImplementation(async (gateway, token, draft) => {
      return gateway.submitDraft(token, draft)
    })
    mockSubmitInvite.mockResolvedValue({
      lead: {
        id: "lead-1",
        agentId: "agent-1",
        buyerName: "Taylor Verify",
        recommendation: "show",
        score: 8.9
      }
    })
    mockGetAgentContext.mockResolvedValue({
      agent: {
        email: "agent@showready.local",
        fullName: "Demo Agent"
      },
      settings: {
        emailNotificationsEnabled: true
      }
    })
    mockListAgentPushTokens.mockResolvedValue(["ExponentPushToken[abc123]"])
    mockSendLeadScoredEmail.mockResolvedValue(undefined)
    mockSendLeadScoredPushNotifications.mockResolvedValue(undefined)
    mockTrackServerEvent.mockResolvedValue(undefined)
  })

  it("submits the intake, sends push plus optional email, and tracks the event", async () => {
    const draft = {
      contact: {
        fullName: "Taylor Verify",
        email: "taylor@example.com",
        phone: "416-555-0101"
      },
      intent: "buy",
      buyer: {
        buyingFor: "myself",
        timeline: "within_1_month",
        budgetKnowledge: "know_it",
        mortgageStatus: "pre_approved",
        neighborhoods: "Toronto",
        propertyType: ["condo"]
      }
    }
    const response = await POST(
      new Request("http://localhost/api/intake/token/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ draft })
      }),
      { params: Promise.resolve({ token: "invite-token" }) }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      lead: {
        id: "lead-1",
        agentId: "agent-1",
        buyerName: "Taylor Verify",
        recommendation: "show",
        score: 8.9
      }
    })
    expect(mockSubmitInvite).toHaveBeenCalledWith({ admin: true }, "invite-token", { draft })
    expect(mockSendLeadScoredPushNotifications).toHaveBeenCalledWith({
      expoPushTokens: ["ExponentPushToken[abc123]"],
      title: "New lead submitted",
      body: "Taylor Verify just submitted the intake form.",
      data: {
        leadId: "lead-1",
        route: "/(app)/new-leads"
      }
    })
    expect(mockSendLeadScoredEmail).toHaveBeenCalledWith({
      to: "agent@showready.local",
      agentName: "Demo Agent",
      buyerName: "Taylor Verify",
      recommendation: "show",
      score: 8.9,
      detailUrl: "http://localhost:3000/leads/lead-1"
    })
    expect(mockTrackServerEvent).toHaveBeenCalledWith(
      "intake.submitted",
      { recommendation: "show" },
      "agent-1"
    )
  })

  it("skips email when the agent leaves email notifications disabled", async () => {
    mockGetAgentContext.mockResolvedValue({
      agent: {
        email: "agent@showready.local",
        fullName: "Demo Agent"
      },
      settings: {
        emailNotificationsEnabled: false
      }
    })

    const response = await POST(
      new Request("http://localhost/api/intake/token/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          draft: {
            contact: {
              fullName: "Taylor Verify"
            }
          }
        })
      }),
      { params: Promise.resolve({ token: "invite-token" }) }
    )

    expect(response.status).toBe(200)
    expect(mockSendLeadScoredPushNotifications).toHaveBeenCalledOnce()
    expect(mockSendLeadScoredEmail).not.toHaveBeenCalled()
  })

  it("still returns success when push notification delivery fails after submission", async () => {
    mockSendLeadScoredPushNotifications.mockRejectedValueOnce(new Error("Expo unavailable"))

    const response = await POST(
      new Request("http://localhost/api/intake/token/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          draft: {
            contact: {
              fullName: "Taylor Verify",
              email: "taylor@example.com"
            },
            intent: "buy"
          }
        })
      }),
      { params: Promise.resolve({ token: "invite-token" }) }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      lead: {
        id: "lead-1",
        agentId: "agent-1",
        buyerName: "Taylor Verify",
        recommendation: "show",
        score: 8.9
      }
    })
    expect(mockCaptureServerError).toHaveBeenCalledWith(
      expect.any(Error),
      "api.intake.submit.push_notifications"
    )
  })

  it("still returns success when email delivery fails after submission", async () => {
    mockSendLeadScoredEmail.mockRejectedValueOnce(new Error("Email unavailable"))

    const response = await POST(
      new Request("http://localhost/api/intake/token/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          draft: {
            contact: {
              fullName: "Taylor Verify",
              email: "taylor@example.com"
            },
            intent: "buy"
          }
        })
      }),
      { params: Promise.resolve({ token: "invite-token" }) }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      lead: {
        id: "lead-1",
        agentId: "agent-1",
        buyerName: "Taylor Verify",
        recommendation: "show",
        score: 8.9
      }
    })
    expect(mockCaptureServerError).toHaveBeenCalledWith(
      expect.any(Error),
      "api.intake.submit.email"
    )
  })

  it("still returns success when analytics tracking fails after submission", async () => {
    mockTrackServerEvent.mockRejectedValueOnce(new Error("Analytics unavailable"))

    const response = await POST(
      new Request("http://localhost/api/intake/token/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          draft: {
            contact: {
              fullName: "Taylor Verify",
              email: "taylor@example.com"
            },
            intent: "buy"
          }
        })
      }),
      { params: Promise.resolve({ token: "invite-token" }) }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      lead: {
        id: "lead-1",
        agentId: "agent-1",
        buyerName: "Taylor Verify",
        recommendation: "show",
        score: 8.9
      }
    })
    expect(mockCaptureServerError).toHaveBeenCalledWith(
      expect.any(Error),
      "api.intake.submit.analytics"
    )
  })
})
