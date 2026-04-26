import { fireEvent, render, waitFor } from "@testing-library/react-native"
import LeadDetailScreen from "../app/lead/[id]"

jest.mock("../providers/session-provider", () => ({
  useSession: jest.fn(),
  useMobileApi: jest.fn()
}))

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => ({ id: "lead-1" })),
  router: {
    canGoBack: jest.fn(() => true),
    back: jest.fn(),
    replace: jest.fn()
  }
}))

const { useSession, useMobileApi } = jest.requireMock("../providers/session-provider") as {
  useSession: jest.Mock
  useMobileApi: jest.Mock
}

const { router } = jest.requireMock("expo-router") as {
  router: {
    canGoBack: jest.Mock
    back: jest.Mock
    replace: jest.Mock
  }
}

describe("LeadDetailScreen", () => {
  let moveLead: jest.Mock
  let overrideLeadScore: jest.Mock

  beforeEach(() => {
    router.canGoBack.mockReturnValue(true)
    router.back.mockReset()
    router.replace.mockReset()
    useSession.mockReturnValue({
      workspaceVersion: 0
    })

    moveLead = jest.fn(async (_leadId: string, stage: string) => ({
      lead: {
        id: "lead-1",
        agentId: "agent-1",
        buyerName: "Taylor Verify",
        buyerEmail: "taylor@example.com",
        buyerPhone: "416-555-0101",
        token: "invite-token",
        tokenExpiresAt: "2026-04-27T00:00:00.000Z",
        status: "pending",
        pipelineStage: stage,
        submittedAt: "2026-04-20T12:00:00.000Z",
        score: 8.9,
        recommendation: "show",
        summary: "Ready to move.",
        createdAt: "2026-04-20T12:00:00.000Z",
        updatedAt: "2026-04-20T12:00:00.000Z",
        answers: {
          contact: {
            fullName: "Taylor Verify",
            email: "taylor@example.com"
          }
        },
        review: {
          suggestedStage: "ready_to_show",
          reviewedStage: "ready_to_show",
          isReviewed: true,
          isOverride: false
        }
      }
    }))
    overrideLeadScore = jest.fn()

    useMobileApi.mockReturnValue({
      getLeadById: jest.fn(async () => ({
        id: "lead-1",
        agentId: "agent-1",
        buyerName: "Taylor Verify",
        buyerEmail: "taylor@example.com",
        buyerPhone: "416-555-0101",
        token: "invite-token",
        tokenExpiresAt: "2026-04-27T00:00:00.000Z",
        status: "pending",
        pipelineStage: "new",
        submittedAt: "2026-04-20T12:00:00.000Z",
        score: 8.9,
        recommendation: "show",
        summary: "Ready to move.",
        createdAt: "2026-04-20T12:00:00.000Z",
        updatedAt: "2026-04-20T12:00:00.000Z",
        answers: {
          contact: {
            fullName: "Taylor Verify",
            email: "taylor@example.com"
          }
        },
        review: {
          suggestedStage: "ready_to_show",
          reviewedStage: "ready_to_show",
          isReviewed: true,
          isOverride: false
        }
      })),
      moveLead,
      overrideLeadScore
    })
  })

  it("shows a back action and returns to the previous screen", async () => {
    const screen = render(<LeadDetailScreen />)

    await screen.findByTestId("lead-open-override-sheet-button")
    expect(
      screen.queryByText(
        "Review scoring context, move the lead through the pipeline, and preserve manual overrides with notes."
      )
    ).toBeNull()

    fireEvent.press(screen.getByTestId("lead-back-button"))

    expect(router.back).toHaveBeenCalledTimes(1)
  })

  it("routes secondary actions through lighter sheet flows", async () => {
    const screen = render(<LeadDetailScreen />)

    expect(await screen.findByTestId("lead-open-stage-sheet-button")).toBeTruthy()
    expect(screen.queryByTestId("lead-move-ready_to_show")).toBeNull()
    expect(screen.queryByTestId("lead-override-score-input")).toBeNull()

    fireEvent.press(screen.getByTestId("lead-open-override-sheet-button"))

    await waitFor(() => {
      expect(screen.getByTestId("lead-override-score-input")).toBeTruthy()
      expect(screen.getByTestId("lead-save-override-button")).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId("lead-open-stage-sheet-button"))
    fireEvent.press(screen.getByTestId("lead-move-closed_won"))

    await waitFor(() => {
      expect(moveLead).toHaveBeenCalledWith("lead-1", "closed_won")
    })
  })
})
