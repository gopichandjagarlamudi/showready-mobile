import { fireEvent, render, waitFor } from "@testing-library/react-native"
import PipelineScreen from "../app/(app)/pipeline"

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

describe("PipelineScreen", () => {
  let moveLead: jest.Mock

  beforeEach(() => {
    useSession.mockReturnValue({
      session: {
        user: {
          id: "agent-1"
        }
      }
    })

    moveLead = jest.fn(async (leadId: string, stage: string) => ({
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

    useMobileApi.mockReturnValue({
      listLeads: jest.fn(async () => [
        {
          id: "lead-ready",
          agentId: "agent-1",
          buyerName: "Riley Ready",
          buyerEmail: "riley@example.com",
          token: "invite-ready",
          tokenExpiresAt: "2026-04-27T00:00:00.000Z",
          status: "submitted",
          pipelineStage: "ready_to_show",
          submittedAt: "2026-04-20T12:00:00.000Z",
          recommendation: "show",
          summary: "Ready to tour.",
          createdAt: "2026-04-20T12:00:00.000Z",
          updatedAt: "2026-04-20T12:00:00.000Z"
        },
        {
          id: "lead-booked",
          agentId: "agent-1",
          buyerName: "Avery Booked",
          buyerEmail: "avery@example.com",
          token: "invite-booked",
          tokenExpiresAt: "2026-04-27T00:00:00.000Z",
          status: "submitted",
          pipelineStage: "appointment_booked",
          submittedAt: "2026-04-20T12:00:00.000Z",
          recommendation: "show",
          summary: "Showing booked but still a ready lead.",
          createdAt: "2026-04-20T12:00:00.000Z",
          updatedAt: "2026-04-20T12:00:00.000Z",
          review: {
            suggestedStage: "ready_to_show",
            reviewedStage: "ready_to_show",
            isReviewed: true,
            isOverride: false
          }
        },
        {
          id: "lead-nurture",
          agentId: "agent-1",
          buyerName: "Nico Nurture",
          buyerEmail: "nico@example.com",
          token: "invite-nurture",
          tokenExpiresAt: "2026-04-27T00:00:00.000Z",
          status: "submitted",
          pipelineStage: "nurture",
          submittedAt: "2026-04-20T12:00:00.000Z",
          recommendation: "nurture",
          summary: "Needs follow-up.",
          createdAt: "2026-04-20T12:00:00.000Z",
          updatedAt: "2026-04-20T12:00:00.000Z"
        },
        {
          id: "lead-hold",
          agentId: "agent-1",
          buyerName: "Harper Hold",
          buyerEmail: "harper@example.com",
          token: "invite-hold",
          tokenExpiresAt: "2026-04-27T00:00:00.000Z",
          status: "submitted",
          pipelineStage: "hold",
          submittedAt: "2026-04-20T12:00:00.000Z",
          recommendation: "hold",
          summary: "Waiting on financing.",
          createdAt: "2026-04-20T12:00:00.000Z",
          updatedAt: "2026-04-20T12:00:00.000Z"
        },
        {
          id: "lead-won",
          agentId: "agent-1",
          buyerName: "Casey Won",
          buyerEmail: "casey@example.com",
          token: "invite-won",
          tokenExpiresAt: "2026-04-27T00:00:00.000Z",
          status: "submitted",
          pipelineStage: "closed_won",
          submittedAt: "2026-04-20T12:00:00.000Z",
          recommendation: "show",
          summary: "Deal closed.",
          createdAt: "2026-04-20T12:00:00.000Z",
          updatedAt: "2026-04-20T12:00:00.000Z"
        },
        {
          id: "lead-lost",
          agentId: "agent-1",
          buyerName: "Logan Lost",
          buyerEmail: "logan@example.com",
          token: "invite-lost",
          tokenExpiresAt: "2026-04-27T00:00:00.000Z",
          status: "submitted",
          pipelineStage: "closed_lost",
          submittedAt: "2026-04-20T12:00:00.000Z",
          recommendation: "nurture",
          summary: "Chose another property.",
          createdAt: "2026-04-20T12:00:00.000Z",
          updatedAt: "2026-04-20T12:00:00.000Z"
        },
        {
          id: "lead-archived",
          agentId: "agent-1",
          buyerName: "Sky Archived",
          buyerEmail: "sky@example.com",
          token: "invite-archived",
          tokenExpiresAt: "2026-04-27T00:00:00.000Z",
          status: "archived",
          pipelineStage: "archived",
          submittedAt: "2026-04-20T12:00:00.000Z",
          recommendation: "hold",
          summary: "Archived.",
          createdAt: "2026-04-20T12:00:00.000Z",
          updatedAt: "2026-04-20T12:00:00.000Z"
        }
      ]),
      moveLead
    })
  })

  it("filters leads through the category picker instead of rendering every section inline", async () => {
    const screen = render(<PipelineScreen />)

    expect(
      screen.queryByText(
        "Search the current lane, switch categories from one mobile-friendly picker, and keep stage moves close to the lead card."
      )
    ).toBeNull()

    expect(await screen.findByTestId("pipeline-card-lead-ready")).toBeTruthy()
    expect(screen.getByTestId("pipeline-card-lead-booked")).toBeTruthy()
    expect(screen.getByTestId("pipeline-card-lead-nurture")).toBeTruthy()
    expect(screen.getByTestId("pipeline-card-lead-hold")).toBeTruthy()
    expect(screen.queryByTestId("pipeline-card-lead-won")).toBeNull()

    fireEvent.press(screen.getByTestId("pipeline-open-category-sheet"))
    expect(screen.getByTestId("pipeline-category-sheet")).toBeTruthy()

    fireEvent.press(screen.getByTestId("pipeline-category-option-nurture"))

    await waitFor(() => {
      expect(screen.getByTestId("pipeline-card-lead-nurture")).toBeTruthy()
    })
    expect(screen.queryByTestId("pipeline-card-lead-ready")).toBeNull()
    expect(screen.queryByTestId("pipeline-card-lead-booked")).toBeNull()
    expect(screen.queryByTestId("pipeline-card-lead-hold")).toBeNull()

    fireEvent.press(screen.getByTestId("pipeline-tab-resolved"))

    await waitFor(() => {
      expect(screen.getByTestId("pipeline-card-lead-won")).toBeTruthy()
    })
    expect(screen.getByTestId("pipeline-card-lead-lost")).toBeTruthy()
    expect(screen.getByTestId("pipeline-card-lead-archived")).toBeTruthy()
    expect(screen.queryByTestId("pipeline-card-lead-nurture")).toBeNull()

    fireEvent.press(screen.getByTestId("pipeline-open-category-sheet"))
    fireEvent.press(screen.getByTestId("pipeline-category-option-archived"))

    await waitFor(() => {
      expect(screen.getByTestId("pipeline-card-lead-archived")).toBeTruthy()
    })
    expect(screen.queryByTestId("pipeline-card-lead-won")).toBeNull()
    expect(screen.queryByTestId("pipeline-card-lead-lost")).toBeNull()
  })

  it("filters the visible pipeline list with search and shows a helpful empty state", async () => {
    const screen = render(<PipelineScreen />)

    expect(await screen.findByTestId("pipeline-search-input")).toBeTruthy()

    fireEvent.changeText(screen.getByTestId("pipeline-search-input"), "avery")

    await waitFor(() => {
      expect(screen.getByTestId("pipeline-card-lead-booked")).toBeTruthy()
    })
    expect(screen.queryByTestId("pipeline-card-lead-ready")).toBeNull()
    expect(screen.queryByTestId("pipeline-card-lead-nurture")).toBeNull()

    fireEvent.changeText(screen.getByTestId("pipeline-search-input"), "missing")

    await waitFor(() => {
      expect(screen.getByText("No leads match this search yet.")).toBeTruthy()
    })
    expect(screen.getByText("Try a name, email, phone number, or a broader category.")).toBeTruthy()
  })

  it("opens a stage picker instead of rendering all move actions inline", async () => {
    const screen = render(<PipelineScreen />)

    expect(await screen.findByTestId("pipeline-open-stage-sheet-lead-ready")).toBeTruthy()
    expect(screen.queryByTestId("pipeline-move-lead-ready-ready_to_show")).toBeNull()

    fireEvent.press(screen.getByTestId("pipeline-open-stage-sheet-lead-ready"))

    expect(screen.getByTestId("pipeline-stage-sheet")).toBeTruthy()
    expect(screen.getByTestId("pipeline-move-lead-ready-closed_won")).toBeTruthy()

    fireEvent.press(screen.getByTestId("pipeline-move-lead-ready-closed_won"))

    await waitFor(() => {
      expect(moveLead).toHaveBeenCalledWith("lead-ready", "closed_won")
    })

    await waitFor(() => {
      expect(screen.queryByTestId("pipeline-card-lead-ready")).toBeNull()
    })

    expect(screen.getByText("Moved Riley Ready to closed won.")).toBeTruthy()
  })
})
