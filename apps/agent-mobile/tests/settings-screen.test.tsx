import { fireEvent, render, waitFor } from "@testing-library/react-native"
import SettingsScreen from "../app/(app)/settings"

jest.mock("../providers/session-provider", () => ({
  useSession: jest.fn(),
  useMobileApi: jest.fn()
}))

const { useSession, useMobileApi } = jest.requireMock("../providers/session-provider") as {
  useSession: jest.Mock
  useMobileApi: jest.Mock
}

describe("SettingsScreen", () => {
  let saveSettings: jest.Mock
  let submitFeedback: jest.Mock

  beforeEach(() => {
    saveSettings = jest.fn(async () => undefined)
    submitFeedback = jest.fn(async () => ({ ok: true }))
    useSession.mockReturnValue({
      session: {
        user: {
          id: "agent-1",
          email: "agent@example.com"
        }
      },
      signOut: jest.fn(async () => undefined)
    })

    useMobileApi.mockReturnValue({
      getSettings: jest.fn(async () => ({
        fullName: "Demo Agent",
        brokerage: "Northline Realty",
        licenseNumber: "SR-2026-001",
        emailNotificationsEnabled: false
      })),
      saveSettings,
      submitFeedback
    })
  })

  it("shows a sign out button and calls sign out when pressed", async () => {
    const signOut = jest.fn(async () => undefined)

    useSession.mockReturnValue({
      session: {
        user: {
          id: "agent-1",
          email: "agent@example.com"
        }
      },
      signOut
    })

    const screen = render(<SettingsScreen />)

    expect(await screen.findByTestId("settings-sign-out-button")).toBeTruthy()

    fireEvent.press(screen.getByTestId("settings-sign-out-button"))

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1)
      expect(screen.getByText("Sign out")).toBeTruthy()
    })
  })

  it("shows an email notification toggle and saves it", async () => {
    const screen = render(<SettingsScreen />)

    await screen.findByTestId("settings-save-button")

    expect(screen.getByText("Also send email notification")).toBeTruthy()
    expect(
      screen.queryByText(
        "Keep your mobile profile clean and accurate without carrying the full desktop admin surface."
      )
    ).toBeNull()
    expect(screen.queryByText("Signed in identity")).toBeNull()
    expect(
      screen.queryByText("Profile updates stay scoped to this signed-in account.")
    ).toBeNull()
    expect(screen.queryByText("Profile maintenance")).toBeNull()
    expect(
      screen.queryByText(
        "Send an email copy when a new lead submits the generated intake form."
      )
    ).toBeNull()

    fireEvent(screen.getByTestId("settings-email-notifications-toggle"), "valueChange", true)
    fireEvent.press(screen.getByTestId("settings-save-button"))

    await waitFor(() => {
      expect(saveSettings).toHaveBeenCalledWith({
        fullName: "Demo Agent",
        brokerage: "Northline Realty",
        licenseNumber: "SR-2026-001",
        emailNotificationsEnabled: true
      })
    })
  })

  it("submits feedback from settings and clears the message", async () => {
    const screen = render(<SettingsScreen />)

    await screen.findByTestId("settings-save-button")

    fireEvent.changeText(
      screen.getByTestId("settings-feedback-input"),
      "  Please add calendar sync for showings.  "
    )
    fireEvent.press(screen.getByTestId("settings-feedback-submit-button"))

    await waitFor(() => {
      expect(submitFeedback).toHaveBeenCalledWith({
        message: "Please add calendar sync for showings."
      })
      expect(screen.getByText("Feedback sent")).toBeTruthy()
      expect(screen.getByTestId("settings-feedback-input").props.value).toBe("")
    })
  })

  it("requires feedback before submitting", async () => {
    const screen = render(<SettingsScreen />)

    await screen.findByTestId("settings-save-button")

    fireEvent.changeText(screen.getByTestId("settings-feedback-input"), "   ")
    fireEvent.press(screen.getByTestId("settings-feedback-submit-button"))

    await waitFor(() => {
      expect(submitFeedback).not.toHaveBeenCalled()
      expect(screen.getByText("Feedback required")).toBeTruthy()
    })
  })
})
