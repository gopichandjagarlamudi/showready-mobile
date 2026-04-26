import { act, render, waitFor } from "@testing-library/react-native"
import { AppState, Text } from "react-native"
import { SessionProvider, useSession } from "./session-provider"

const mockChannel = {
  on: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn()
}

const mockRemoveChannel = jest.fn()
const mockAuthUnsubscribe = jest.fn()
const mockGetSession = jest.fn()
const mockOnAuthStateChange = jest.fn()
const mockSignOut = jest.fn()
const mockStartAutoRefresh = jest.fn()
const mockStopAutoRefresh = jest.fn()
const mockSupabaseChannel = jest.fn()
const mockGetInitialUrl = jest.fn()
const mockAddEventListener = jest.fn()
const mockRestoreSessionFromUrl = jest.fn()
const mockCaptureDiagnosticsError = jest.fn()
const mockFlushDiagnostics = jest.fn()
const mockSetDiagnosticsApiClient = jest.fn()
const mockReportApiRequestError = jest.fn()
const mockListNewLeads = jest.fn()
const mockRegisterPushToken = jest.fn()
const mockGetPermissionsAsync = jest.fn()
const mockRequestPermissionsAsync = jest.fn()
const mockGetExpoPushTokenAsync = jest.fn()
const mockAddNotificationReceivedListener = jest.fn()
const mockAddNotificationResponseReceivedListener = jest.fn()
const mockRouterPush = jest.fn()
let notificationResponseListener: ((response: any) => void) | null = null
let notificationReceivedListener: ((response: any) => void) | null = null

jest.mock("@showready/infrastructure", () => ({
  createMobileApiClient: jest.fn(() => ({
    listLeads: jest.fn(),
    listNewLeads: (...args: unknown[]) => mockListNewLeads(...args),
    registerPushToken: (...args: unknown[]) => mockRegisterPushToken(...args)
  }))
}))

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: (...args: unknown[]) => mockGetPermissionsAsync(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
  getExpoPushTokenAsync: (...args: unknown[]) => mockGetExpoPushTokenAsync(...args),
  addNotificationReceivedListener: (...args: unknown[]) =>
    mockAddNotificationReceivedListener(...args),
  addNotificationResponseReceivedListener: (...args: unknown[]) =>
    mockAddNotificationResponseReceivedListener(...args)
}))

jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args)
  }
}))

jest.mock("expo-linking", () => ({
  getInitialURL: (...args: unknown[]) => mockGetInitialUrl(...args),
  addEventListener: (...args: unknown[]) => mockAddEventListener(...args)
}))

jest.mock("../lib/auth-oauth", () => ({
  restoreSessionFromUrl: (...args: unknown[]) => mockRestoreSessionFromUrl(...args)
}))

jest.mock("../lib/diagnostics/service", () => ({
  captureDiagnosticsError: (...args: unknown[]) => mockCaptureDiagnosticsError(...args),
  flushDiagnostics: (...args: unknown[]) => mockFlushDiagnostics(...args),
  reportApiRequestError: (...args: unknown[]) => mockReportApiRequestError(...args),
  setDiagnosticsApiClient: (...args: unknown[]) => mockSetDiagnosticsApiClient(...args)
}))

jest.mock("../lib/env", () => ({
  getApiBaseUrl: jest.fn(() => "https://example.com")
}))

jest.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      startAutoRefresh: (...args: unknown[]) => mockStartAutoRefresh(...args),
      stopAutoRefresh: (...args: unknown[]) => mockStopAutoRefresh(...args)
    },
    channel: (...args: unknown[]) => mockSupabaseChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args)
  }
}))

function SessionValueProbe() {
  const { session, workspaceVersion, unreadNewLeadsCount } = useSession()

  return (
    <>
      <Text testID="session-user">{session?.user.id ?? "none"}</Text>
      <Text testID="workspace-version">{workspaceVersion}</Text>
      <Text testID="unread-new-leads">{unreadNewLeadsCount}</Text>
    </>
  )
}

describe("SessionProvider realtime refresh", () => {
  let appStateChangeListener: ((state: string) => void) | null = null
  let appStateAddEventListenerSpy: jest.SpyInstance

  beforeEach(() => {
    appStateChangeListener = null
    Object.defineProperty(AppState, "currentState", {
      configurable: true,
      value: "active"
    })
    appStateAddEventListenerSpy = jest.spyOn(AppState, "addEventListener")
    appStateAddEventListenerSpy.mockImplementation((type, listener) => {
      if (type === "change") {
        appStateChangeListener = listener as (state: string) => void
      }

      return {
        remove: jest.fn()
      } as never
    })

    mockChannel.on.mockReset()
    mockChannel.on.mockImplementation(() => mockChannel)
    mockChannel.subscribe.mockReset()
    mockChannel.subscribe.mockImplementation(() => mockChannel)
    mockChannel.unsubscribe.mockReset()

    mockRemoveChannel.mockReset()
    mockAuthUnsubscribe.mockReset()
    mockGetSession.mockReset()
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "agent-1"
          }
        }
      }
    })

    mockOnAuthStateChange.mockReset()
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: mockAuthUnsubscribe
        }
      }
    })

    mockSignOut.mockReset()
    mockSignOut.mockResolvedValue({ error: null })
    mockStartAutoRefresh.mockReset()
    mockStartAutoRefresh.mockResolvedValue(undefined)
    mockStopAutoRefresh.mockReset()
    mockStopAutoRefresh.mockResolvedValue(undefined)
    mockSupabaseChannel.mockReset()
    mockSupabaseChannel.mockReturnValue(mockChannel)
    mockGetInitialUrl.mockReset()
    mockGetInitialUrl.mockResolvedValue(null)
    mockAddEventListener.mockReset()
    mockAddEventListener.mockReturnValue({
      remove: jest.fn()
    })
    mockRestoreSessionFromUrl.mockReset()
    mockCaptureDiagnosticsError.mockReset()
    mockCaptureDiagnosticsError.mockResolvedValue(undefined)
    mockFlushDiagnostics.mockReset()
    mockFlushDiagnostics.mockResolvedValue(undefined)
    mockSetDiagnosticsApiClient.mockReset()
    mockReportApiRequestError.mockReset()
    mockReportApiRequestError.mockResolvedValue(undefined)
    mockListNewLeads.mockReset()
    mockListNewLeads.mockResolvedValue([{ id: "lead-new" }])
    mockRegisterPushToken.mockReset()
    mockRegisterPushToken.mockResolvedValue({ ok: true })
    mockGetPermissionsAsync.mockReset()
    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" })
    mockRequestPermissionsAsync.mockReset()
    mockRequestPermissionsAsync.mockResolvedValue({ status: "granted" })
    mockGetExpoPushTokenAsync.mockReset()
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: "ExponentPushToken[test]" })
    mockAddNotificationReceivedListener.mockReset()
    mockAddNotificationReceivedListener.mockImplementation((listener) => {
      notificationReceivedListener = listener
      return {
        remove: jest.fn()
      }
    })
    mockAddNotificationResponseReceivedListener.mockReset()
    mockAddNotificationResponseReceivedListener.mockImplementation((listener) => {
      notificationResponseListener = listener
      return {
        remove: jest.fn()
      }
    })
    mockRouterPush.mockReset()
    notificationReceivedListener = null
    notificationResponseListener = null
  })

  afterEach(() => {
    appStateAddEventListenerSpy.mockRestore()
  })

  it("bumps workspace version when a lead realtime event arrives", async () => {
    const screen = render(
      <SessionProvider>
        <SessionValueProbe />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("session-user").props.children).toBe("agent-1")
    })

    const leadChangeCallback = mockChannel.on.mock.calls.find(
      ([type, filter]) =>
        type === "postgres_changes" &&
        filter?.schema === "public" &&
        filter?.table === "leads"
    )?.[2]

    expect(leadChangeCallback).toBeDefined()
    expect(screen.getByTestId("workspace-version").props.children).toBe(0)

    await act(async () => {
      leadChangeCallback?.({
        eventType: "INSERT",
        new: { id: "lead-2", agent_id: "agent-1" }
      })
    })

    expect(screen.getByTestId("workspace-version").props.children).toBe(1)
    expect(mockSupabaseChannel).toHaveBeenCalledWith("mobile-workspace-agent-1")
  })

  it("registers push tokens, tracks unread new leads, and routes notification taps", async () => {
    const screen = render(
      <SessionProvider>
        <SessionValueProbe />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("unread-new-leads").props.children).toBe(1)
    })

    expect(mockRegisterPushToken).toHaveBeenCalledWith({
      expoPushToken: "ExponentPushToken[test]",
      platform: expect.any(String)
    })

    await act(async () => {
      notificationResponseListener?.({
        notification: {
          request: {
            content: {
              data: {
                route: "/(app)/new-leads"
              }
            }
          }
        }
      })
    })

    expect(mockRouterPush).toHaveBeenCalledWith("/new-leads")
  })

  it("refreshes workspace state when a new-lead notification arrives in the foreground", async () => {
    mockListNewLeads.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: "lead-fresh" }])

    const screen = render(
      <SessionProvider>
        <SessionValueProbe />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("unread-new-leads").props.children).toBe(0)
    })

    await waitFor(() => {
      expect(mockAddNotificationReceivedListener).toHaveBeenCalledTimes(1)
    })

    const receivedCallback = mockAddNotificationReceivedListener.mock.calls[0]?.[0]

    await act(async () => {
      receivedCallback?.({
        request: {
          content: {
            data: {
              route: "/(app)/new-leads"
            }
          }
        }
      })
    })

    await waitFor(() => {
      expect(screen.getByTestId("workspace-version").props.children).toBe(1)
    })

    await waitFor(() => {
      expect(screen.getByTestId("unread-new-leads").props.children).toBe(1)
    })
  })

  it("starts and stops Supabase auto-refresh with the app state", async () => {
    const screen = render(
      <SessionProvider>
        <SessionValueProbe />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("session-user").props.children).toBe("agent-1")
    })

    expect(mockStartAutoRefresh).toHaveBeenCalledTimes(1)

    await act(async () => {
      appStateChangeListener?.("background")
    })

    expect(mockStopAutoRefresh).toHaveBeenCalled()

    await act(async () => {
      appStateChangeListener?.("active")
    })

    expect(mockStartAutoRefresh).toHaveBeenCalledTimes(2)
  })

  it("clears a stale stored session when Supabase cannot refresh it during bootstrap", async () => {
    const staleRefreshError = new Error("Invalid Refresh Token: Refresh Token Not Found")
    mockGetSession.mockResolvedValue({
      data: {
        session: null
      },
      error: staleRefreshError
    })

    const screen = render(
      <SessionProvider>
        <SessionValueProbe />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("session-user").props.children).toBe("none")
    })

    expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" })
    expect(mockStopAutoRefresh).toHaveBeenCalled()
    expect(mockCaptureDiagnosticsError).toHaveBeenCalledWith(
      staleRefreshError,
      expect.objectContaining({
        category: "auth",
        severity: "warning"
      })
    )
  })

  it("still clears a stale stored session when diagnostics reporting fails", async () => {
    mockCaptureDiagnosticsError.mockRejectedValue(new Error("Diagnostics unavailable"))
    mockGetSession.mockResolvedValue({
      data: {
        session: null
      },
      error: new Error("Invalid Refresh Token: Refresh Token Not Found")
    })

    const screen = render(
      <SessionProvider>
        <SessionValueProbe />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("session-user").props.children).toBe("none")
    })

    expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" })
    expect(mockStopAutoRefresh).toHaveBeenCalled()
  })
})
