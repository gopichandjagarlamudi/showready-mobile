import { fireEvent, render, waitFor } from "@testing-library/react-native"
import type { Lead, LeadListResponse } from "@showready/contracts"
import NewLeadsScreen from "../app/(app)/new-leads"

jest.mock("../providers/session-provider", () => ({
  useSession: jest.fn(),
  useMobileApi: jest.fn()
}))

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn()
  }
}))

const { useSession, useMobileApi } = jest.requireMock("../providers/session-provider") as {
  useSession: jest.Mock
  useMobileApi: jest.Mock
}
const { router } = jest.requireMock("expo-router") as {
  router: {
    push: jest.Mock
  }
}

describe("NewLeadsScreen", () => {
  let workspaceVersion = 0
  const refreshWorkspace = jest.fn()
  const reviewQueueLead: Lead = {
    id: "lead-ready",
    agentId: "agent-1",
    buyerName: "Riley Ready",
    buyerEmail: "riley@example.com",
    intakeType: "sale",
    token: "invite-ready",
    tokenExpiresAt: "2026-04-27T00:00:00.000Z",
    status: "submitted",
    pipelineStage: "new",
    submittedAt: "2026-04-20T12:00:00.000Z",
    recommendation: "show",
    summary: "Ready to tour.",
    createdAt: "2026-04-20T12:00:00.000Z",
    updatedAt: "2026-04-20T12:00:00.000Z"
  }
  const session = {
    user: {
      id: "agent-1"
    }
  }
  const api = {
    listNewLeads: jest.fn(async (): Promise<LeadListResponse> => ({
      leads: [] as Lead[],
      total: 0
    })),
    reviewLead: jest.fn(async (leadId: string, stage: string) => ({
      lead: {
        id: leadId,
        agentId: "agent-1",
        buyerName: "Riley Ready",
        buyerEmail: "riley@example.com",
        token: "invite-ready",
        tokenExpiresAt: "2026-04-27T00:00:00.000Z",
        status: "submitted",
        pipelineStage: stage,
        submittedAt: "2026-04-20T12:00:00.000Z",
        recommendation: "show",
        summary: "Ready to tour.",
        createdAt: "2026-04-20T12:00:00.000Z",
        updatedAt: "2026-04-20T12:00:00.000Z"
      }
    }))
  }

  beforeEach(() => {
    workspaceVersion = 0
    api.listNewLeads.mockClear()
    api.reviewLead.mockClear()
    router.push.mockReset()
    refreshWorkspace.mockReset()

    useSession.mockImplementation(() => ({
      session,
      workspaceVersion,
      refreshWorkspace
    }))

    useMobileApi.mockImplementation(() => api)
  })

  it("reloads the review queue when the workspace refresh version changes", async () => {
    const screen = render(<NewLeadsScreen />)

    expect(
      screen.queryByText(
        "Fresh submissions wait here until you confirm the suggested direction or deliberately reroute them."
      )
    ).toBeNull()

    await waitFor(() => {
      expect(api.listNewLeads).toHaveBeenCalledTimes(1)
    })
    expect(screen.getByTestId("new-leads-invite-tools-button")).toBeTruthy()

    workspaceVersion = 1
    screen.rerender(<NewLeadsScreen />)

    await waitFor(() => {
      expect(api.listNewLeads).toHaveBeenCalledTimes(2)
    })
  })

  it("refreshes the shared workspace badge state after a lead review succeeds", async () => {
    api.listNewLeads.mockResolvedValueOnce({
      leads: [reviewQueueLead],
      total: 1
    })

    const screen = render(<NewLeadsScreen />)

    fireEvent.press(await screen.findByTestId("review-confirm-lead-ready"))

    await waitFor(() => {
      expect(api.reviewLead).toHaveBeenCalledWith("lead-ready", "ready_to_show")
    })

    await waitFor(() => {
      expect(refreshWorkspace).toHaveBeenCalledTimes(1)
    })
  })

  it("loads the review queue in pages and appends the next page", async () => {
    api.listNewLeads
      .mockResolvedValueOnce({
        leads: [reviewQueueLead],
        total: 2,
        nextOffset: 25
      })
      .mockResolvedValueOnce({
        leads: [
          {
            ...reviewQueueLead,
            id: "lead-next",
            buyerName: "Jordan Later"
          }
        ],
        total: 2
      })

    const screen = render(<NewLeadsScreen />)

    expect(await screen.findByTestId("new-lead-card-lead-ready")).toBeTruthy()
    fireEvent.press(screen.getByTestId("new-leads-load-more"))

    await waitFor(() => {
      expect(screen.getByTestId("new-lead-card-lead-next")).toBeTruthy()
    })
    expect(api.listNewLeads).toHaveBeenCalledWith({
      limit: 25,
      offset: 25
    })
  })

  it("labels lead cards with buy and rent intent tags", async () => {
    api.listNewLeads.mockResolvedValueOnce({
      leads: [
        reviewQueueLead,
        {
          ...reviewQueueLead,
          id: "lead-rental",
          buyerName: "Rowan Rental",
          intakeType: "rental"
        }
      ],
      total: 2
    })

    const screen = render(<NewLeadsScreen />)

    expect(await screen.findByTestId("new-lead-intent-chip-lead-ready")).toBeTruthy()
    expect(screen.getByTestId("new-lead-intent-chip-lead-rental")).toBeTruthy()
    expect(screen.getByText("Buy")).toBeTruthy()
    expect(screen.getByText("Rent")).toBeTruthy()
  })

  it("opens settings from the new leads header", async () => {
    const screen = render(<NewLeadsScreen />)

    fireEvent.press(await screen.findByTestId("new-leads-settings-button"))

    expect(router.push).toHaveBeenCalledWith("/settings")
  })
})
