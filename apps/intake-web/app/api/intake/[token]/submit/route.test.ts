import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

const {
  mockSubmitIntakeDraft,
  mockCreateSupabaseAdminClient,
  mockSubmitInvite,
  mockGetAgentContext,
  mockSendLeadScoredEmail,
  mockTrackServerEvent
} = vi.hoisted(() => ({
  mockSubmitIntakeDraft: vi.fn(),
  mockCreateSupabaseAdminClient: vi.fn(),
  mockSubmitInvite: vi.fn(),
  mockGetAgentContext: vi.fn(),
  mockSendLeadScoredEmail: vi.fn(),
  mockTrackServerEvent: vi.fn()
}))

vi.mock("@showready/application", () => ({
  submitIntakeDraft: mockSubmitIntakeDraft
}))

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mockCreateSupabaseAdminClient
}))

vi.mock("@/lib/supabase/data", () => ({
  submitInvite: mockSubmitInvite,
  getAgentContext: mockGetAgentContext
}))

vi.mock("@/lib/notifications", () => ({
  sendLeadScoredEmail: mockSendLeadScoredEmail
}))

vi.mock("@/lib/analytics", () => ({
  trackServerEvent: mockTrackServerEvent
}))

describe("POST /api/intake/[token]/submit", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"
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
      }
    })
    mockSendLeadScoredEmail.mockResolvedValue(undefined)
    mockTrackServerEvent.mockResolvedValue(undefined)
  })

  it("submits the intake, emails the agent, and tracks the event", async () => {
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
        propertyType: "condo"
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
})
