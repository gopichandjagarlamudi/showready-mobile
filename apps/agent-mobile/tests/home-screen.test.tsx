import { fireEvent, render, waitFor } from "@testing-library/react-native"
import HomeScreen from "../app/(app)/home"

jest.mock("../providers/session-provider", () => ({
  useSession: jest.fn(),
  useMobileApi: jest.fn()
}))

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn()
  }
}))

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn()
}))

const mockShare = jest.fn()

jest.mock("react-native/Libraries/Share/Share", () => ({
  share: (...args: unknown[]) => mockShare(...args)
}))

const { useSession, useMobileApi } = jest.requireMock("../providers/session-provider") as {
  useSession: jest.Mock
  useMobileApi: jest.Mock
}

const { setStringAsync } = jest.requireMock("expo-clipboard") as {
  setStringAsync: jest.Mock
}

describe("HomeScreen", () => {
  beforeEach(() => {
    mockShare.mockReset()
    setStringAsync.mockReset()
    useSession.mockReturnValue({
      session: {
        user: {
          id: "agent-1"
        }
      }
    })
    useMobileApi.mockReturnValue({
      getDashboardSummary: jest.fn(async () => ({
        totalLeads: 12,
        readyToShow: 2,
        appointmentBooked: 1,
        nurture: 4,
        hold: 3,
        averageScore: 7.2
      })),
      listLeads: jest.fn(async () => []),
      createInvite: jest.fn(async () => ({
        token: "invite-token",
        shareUrl: "https://showready.example.com/intake/invite-token",
        expiresAt: "2026-04-27T12:00:00.000Z"
      }))
    })
  })

  it("shows the generated invite link and copies it from the dashboard", async () => {
    const screen = render(<HomeScreen />)

    expect(
      screen.queryByText(
        "One mobile command center for invite creation, live pipeline health, and fast access to the leads that need action first."
      )
    ).toBeNull()

    fireEvent.press(await screen.findByTestId("invite-sheet-open-button"))
    fireEvent.press(await screen.findByText("Create invite"))

    await screen.findByText("https://showready.example.com/intake/invite-token")
    expect(screen.getByTestId("copy-invite-button")).toBeTruthy()
    expect(mockShare).not.toHaveBeenCalled()

    fireEvent.press(screen.getByTestId("copy-invite-button"))

    await waitFor(() => {
      expect(setStringAsync).toHaveBeenCalledWith(
        "https://showready.example.com/intake/invite-token"
      )
    })
  })
})
