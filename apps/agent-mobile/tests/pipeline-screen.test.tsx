import { fireEvent, render, within } from "@testing-library/react-native"
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

  it("renders active and resolved leads inside explicit category sections", async () => {
    const screen = render(<PipelineScreen />)

    expect(await screen.findByTestId("pipeline-section-ready_to_show")).toBeTruthy()
    expect(screen.getByTestId("pipeline-section-nurture")).toBeTruthy()
    expect(screen.getByTestId("pipeline-section-hold")).toBeTruthy()

    const readySection = screen.getByTestId("pipeline-section-ready_to_show")
    expect(within(readySection).getByText("Riley Ready")).toBeTruthy()
    expect(within(readySection).getByText("Avery Booked")).toBeTruthy()
    expect(within(readySection).queryByText("Nico Nurture")).toBeNull()

    fireEvent.press(screen.getByTestId("pipeline-tab-resolved"))

    expect(await screen.findByTestId("pipeline-section-closed_won")).toBeTruthy()
    expect(screen.getByTestId("pipeline-section-closed_lost")).toBeTruthy()
    expect(screen.getByTestId("pipeline-section-archived")).toBeTruthy()

    expect(within(screen.getByTestId("pipeline-section-closed_won")).getByText("Casey Won")).toBeTruthy()
    expect(within(screen.getByTestId("pipeline-section-closed_lost")).getByText("Logan Lost")).toBeTruthy()
    expect(within(screen.getByTestId("pipeline-section-archived")).getByText("Sky Archived")).toBeTruthy()
  })

  it("opens a stage picker instead of rendering all move actions inline", async () => {
    const screen = render(<PipelineScreen />)

    expect(await screen.findByTestId("pipeline-open-stage-sheet-lead-ready")).toBeTruthy()
    expect(screen.queryByTestId("pipeline-move-lead-ready-ready_to_show")).toBeNull()

    fireEvent.press(screen.getByTestId("pipeline-open-stage-sheet-lead-ready"))

    expect(screen.getByTestId("pipeline-stage-sheet")).toBeTruthy()
    expect(screen.getByTestId("pipeline-move-lead-ready-closed_won")).toBeTruthy()

    fireEvent.press(screen.getByTestId("pipeline-move-lead-ready-closed_won"))

    expect(moveLead).toHaveBeenCalledWith("lead-ready", "closed_won")
  })
})
