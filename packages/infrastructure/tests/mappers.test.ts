import { describe, expect, it } from "vitest"
import { buildAnswerMaps, mapLeadRecord } from "../src/mappers"

describe("supabase mappers", () => {
  it("builds answer maps from flattened rows", () => {
    const result = buildAnswerMaps(
      [
        { question_key: "buyer.timeline", answer_value: "within_1_month" },
        { question_key: "custom.referral_source", answer_value: "Instagram" }
      ],
      {
        buyer_name: "Taylor Client",
        buyer_phone: null,
        buyer_email: "taylor@example.com",
        intake_type: "sale"
      }
    )

    expect(result.answers.contact.fullName).toBe("Taylor Client")
    expect(result.answers.intent).toBe("buy")
    expect(result.answers.buyer?.timeline).toBe("within_1_month")
    expect(result.customAnswers.referral_source).toBe("Instagram")
  })

  it("maps lead rows with review state", () => {
    const lead = mapLeadRecord({
      id: "lead-1",
      agent_id: "agent-1",
      intake_type: "sale",
      buyer_name: "Taylor Client",
      buyer_phone: null,
      buyer_email: "taylor@example.com",
      token: "token-1",
      token_expires_at: "2026-04-26T00:00:00.000Z",
      status: "submitted",
      pipeline_stage: "new",
      submitted_at: "2026-04-19T00:00:00.000Z",
      score: 8.4,
      recommendation: "show",
      summary: "Strong buyer lead",
      created_at: "2026-04-19T00:00:00.000Z",
      updated_at: "2026-04-19T00:00:00.000Z",
      reviewed_at: null,
      reviewed_stage: null
    })

    expect(lead.review?.suggestedStage).toBe("ready_to_show")
    expect(lead.buyerName).toBe("Taylor Client")
  })
})
