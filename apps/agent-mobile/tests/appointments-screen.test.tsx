import { fireEvent, render } from "@testing-library/react-native"
import AppointmentsScreen from "../app/(app)/appointments"

jest.mock("../providers/session-provider", () => ({
  useSession: jest.fn(),
  useMobileApi: jest.fn()
}))

const { useSession, useMobileApi } = jest.requireMock("../providers/session-provider") as {
  useSession: jest.Mock
  useMobileApi: jest.Mock
}

describe("AppointmentsScreen", () => {
  beforeEach(() => {
    useSession.mockReturnValue({
      session: {
        user: {
          id: "agent-1"
        }
      }
    })

    useMobileApi.mockReturnValue({
      listAppointments: jest.fn(async () => []),
      listLeads: jest.fn(async () => [
        {
          id: "lead-1",
          agentId: "agent-1",
          buyerName: "Jordan Lane",
          buyerEmail: "jordan@example.com",
          buyerPhone: "416-555-0102",
          token: "invite-token",
          tokenExpiresAt: "2026-04-27T00:00:00.000Z",
          status: "pending",
          pipelineStage: "ready_to_show",
          submittedAt: "2026-04-20T12:00:00.000Z",
          score: 8.2,
          recommendation: "show",
          summary: "Ready for a showing.",
          createdAt: "2026-04-20T12:00:00.000Z",
          updatedAt: "2026-04-20T12:00:00.000Z"
        }
      ]),
      saveAppointment: jest.fn(),
      updateAppointmentStatus: jest.fn()
    })
  })

  it("separates scheduling from queue review with a mode toggle", async () => {
    const screen = render(<AppointmentsScreen />)

    await screen.findByTestId("appointments-open-schedule-sheet")
    expect(screen.queryByTestId("appointment-save-button")).toBeNull()

    fireEvent.press(screen.getByTestId("appointments-open-schedule-sheet"))

    expect(await screen.findByTestId("appointment-save-button")).toBeTruthy()
  })
})
