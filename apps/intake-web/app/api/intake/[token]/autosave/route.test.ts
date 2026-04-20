import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

const { mockAutosaveIntakeStep, mockCreateSupabaseAdminClient, mockAutosaveInviteDraft } =
  vi.hoisted(() => ({
    mockAutosaveIntakeStep: vi.fn(),
    mockCreateSupabaseAdminClient: vi.fn(),
    mockAutosaveInviteDraft: vi.fn()
  }))

vi.mock("@showready/application", () => ({
  autosaveIntakeStep: mockAutosaveIntakeStep
}))

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mockCreateSupabaseAdminClient
}))

vi.mock("@/lib/supabase/data", () => ({
  autosaveInviteDraft: mockAutosaveInviteDraft
}))

describe("POST /api/intake/[token]/autosave", () => {
  beforeEach(() => {
    mockCreateSupabaseAdminClient.mockReturnValue({ admin: true })
    mockAutosaveIntakeStep.mockImplementation(async (gateway, token, draft) => {
      return gateway.autosaveDraft(token, draft)
    })
    mockAutosaveInviteDraft.mockResolvedValue(undefined)
  })

  it("persists the draft through the application gateway", async () => {
    const draft = {
      contact: { fullName: "Taylor Verify", email: "taylor@example.com" },
      intent: "buy"
    }
    const response = await POST(
      new Request("http://localhost/api/intake/token/autosave", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ draft })
      }),
      { params: Promise.resolve({ token: "invite-token" }) }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(mockAutosaveInviteDraft).toHaveBeenCalledWith({ admin: true }, "invite-token", draft)
  })
})
