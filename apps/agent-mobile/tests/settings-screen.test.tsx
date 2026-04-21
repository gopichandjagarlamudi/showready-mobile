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

  beforeEach(() => {
    saveSettings = jest.fn(async () => undefined)
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
      saveSettings
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
})
