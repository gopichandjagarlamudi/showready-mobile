import { fireEvent, render, waitFor } from "@testing-library/react-native"
import AppointmentsScreen from "../app/(app)/appointments"

jest.mock(
  "@react-native-community/datetimepicker",
  () => {
    const React = require("react")
    const { Pressable, Text } = require("react-native")

    return function MockDateTimePicker(props: {
      mode: "date" | "time"
      onChange: (event: { type: string }, date?: Date) => void
      testID?: string
    }) {
      return React.createElement(
        Pressable,
        {
          testID: props.testID,
          onPress: () =>
            props.onChange(
              { type: "set" },
              props.mode === "date"
                ? new Date(2026, 3, 24, 9, 0)
                : new Date(2026, 3, 24, 14, 30)
            )
        },
        React.createElement(Text, null, props.mode)
      )
    }
  },
  { virtual: true }
)

jest.mock("../providers/session-provider", () => ({
  useSession: jest.fn(),
  useMobileApi: jest.fn()
}))

const { useSession, useMobileApi } = jest.requireMock("../providers/session-provider") as {
  useSession: jest.Mock
  useMobileApi: jest.Mock
}

describe("AppointmentsScreen", () => {
  let saveAppointment: jest.Mock

  beforeEach(() => {
    useSession.mockReturnValue({
      session: {
        user: {
          id: "agent-1"
        }
      }
    })

    saveAppointment = jest.fn(async () => ({ ok: true }))

    useMobileApi.mockReturnValue({
      listAppointments: jest.fn(async () => []),
      listLeads: jest.fn(async () => [
        {
          id: "lead-1",
          agentId: "agent-1",
          buyerName: "Jordan Lane",
          buyerEmail: "jordan@example.com",
          buyerPhone: "416-555-0102",
          intakeType: "sale",
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
        },
        {
          id: "lead-2",
          agentId: "agent-1",
          buyerName: "Briar Stone",
          buyerEmail: "briar@example.com",
          buyerPhone: "416-555-0103",
          intakeType: "sale",
          token: "invite-token-2",
          tokenExpiresAt: "2026-04-27T00:00:00.000Z",
          status: "pending",
          pipelineStage: "nurture",
          submittedAt: "2026-04-20T12:00:00.000Z",
          score: 6.4,
          recommendation: "nurture",
          summary: "Needs a second conversation.",
          createdAt: "2026-04-20T12:00:00.000Z",
          updatedAt: "2026-04-20T12:00:00.000Z"
        }
      ]),
      saveAppointment,
      updateAppointmentStatus: jest.fn()
    })
  })

  it("opens a searchable schedule sheet with an explicit close action", async () => {
    const screen = render(<AppointmentsScreen />)

    await screen.findByTestId("appointments-open-schedule-sheet")
    expect(
      screen.queryByText(
        "Keep scheduling and queue review separate so every appointment task is clear on a phone-sized screen."
      )
    ).toBeNull()
    expect(screen.queryByTestId("appointment-save-button")).toBeNull()

    fireEvent.press(screen.getByTestId("appointments-open-schedule-sheet"))

    expect(await screen.findByTestId("appointment-save-button")).toBeTruthy()
    expect(screen.getByTestId("appointment-lead-search-input")).toBeTruthy()
    expect(screen.getByTestId("appointments-schedule-sheet-close")).toBeTruthy()

    fireEvent.changeText(screen.getByTestId("appointment-lead-search-input"), "briar")

    await waitFor(() => {
      expect(screen.getByTestId("appointment-lead-option-lead-2")).toBeTruthy()
    })
    expect(screen.queryByTestId("appointment-lead-option-lead-1")).toBeNull()

    fireEvent.press(screen.getByTestId("appointments-schedule-sheet-close"))

    await waitFor(() => {
      expect(screen.queryByTestId("appointment-save-button")).toBeNull()
    })
  })

  it("uses native date and time pickers when saving an appointment", async () => {
    const screen = render(<AppointmentsScreen />)

    fireEvent.press(await screen.findByTestId("appointments-open-schedule-sheet"))

    expect(screen.queryByTestId("appointment-date-input")).toBeNull()
    expect(screen.queryByTestId("appointment-start-time-input")).toBeNull()

    fireEvent.changeText(screen.getByTestId("appointment-lead-search-input"), "jordan")
    fireEvent.press(screen.getByTestId("appointment-lead-option-lead-1"))

    fireEvent.press(screen.getByTestId("appointment-open-date-picker"))
    fireEvent.press(screen.getByTestId("appointment-native-date-picker"))

    fireEvent.press(screen.getByTestId("appointment-open-time-picker"))
    fireEvent.press(screen.getByTestId("appointment-native-time-picker"))

    fireEvent.changeText(screen.getByTestId("appointment-address-input"), "123 Queen St W, Toronto")
    fireEvent.changeText(screen.getByTestId("appointment-notes-input"), "Use the side entrance.")
    fireEvent.press(screen.getByTestId("appointment-save-button"))

    await waitFor(() => {
      expect(saveAppointment).toHaveBeenCalledWith({
        leadId: "lead-1",
        date: "2026-04-24",
        startTime: "14:30",
        notes: "Use the side entrance.",
        showings: [{ address: "123 Queen St W, Toronto" }]
      })
    })
  })
})
