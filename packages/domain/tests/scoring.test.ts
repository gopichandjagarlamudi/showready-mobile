import { describe, expect, it } from "vitest"
import type { IntakeSubmission } from "@showready/contracts"
import { scoreLead } from "../src/scoring"

describe("scoreLead", () => {
  it("scores a strong buyer lead into show", () => {
    const submission: IntakeSubmission = {
      contact: {
        fullName: "Taylor Buyer",
        email: "taylor@example.com"
      },
      intent: "buy",
      buyer: {
        buyingFor: "myself",
        timeline: "within_1_month",
        budgetKnowledge: "know_it",
        mortgageStatus: "pre_approved",
        neighborhoods: "Riverdale",
        propertyType: "detached",
        bedrooms: "3",
        bathrooms: "2",
        mustHaves: ["parking", "near_school"]
      }
    }

    const result = scoreLead(submission)

    expect(result.recommendation).toBe("show")
    expect(result.total).toBeGreaterThanOrEqual(8)
    expect(result.nextAction).toContain("buyer consultation")
  })

  it("keeps an exploratory rental lead in hold", () => {
    const submission: IntakeSubmission = {
      contact: {
        fullName: "Riley Renter",
        phone: "555-1111"
      },
      intent: "rent",
      rental: {
        moveTimeline: "exploring",
        rentRange: "",
        neighborhoods: "",
        placeType: "not_sure",
        bedrooms: "1",
        hasPets: "no",
        occupantCount: "1",
        incomeProof: "no"
      }
    }

    const result = scoreLead(submission)

    expect(result.recommendation).toBe("hold")
    expect(result.total).toBeLessThan(5)
    expect(result.summary).toContain("Recommended path")
  })
})
