import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { PropsWithChildren } from "react"
import * as Linking from "expo-linking"
import * as Notifications from "expo-notifications"
import { AppState, Platform } from "react-native"
import type { AppStateStatus } from "react-native"
import type { Session } from "@supabase/supabase-js"
import { router } from "expo-router"
import { createMobileApiClient } from "@showready/infrastructure"
import { restoreSessionFromUrl } from "../lib/auth-oauth"
import {
  captureDiagnosticsError,
  flushDiagnostics,
  reportApiRequestError,
  setDiagnosticsApiClient
} from "../lib/diagnostics/service"
import { getApiBaseUrl } from "../lib/env"
import { supabase } from "../lib/supabase"

type SessionContextValue = {
  session: Session | null
  isBootstrapping: boolean
  workspaceVersion: number
  unreadNewLeadsCount: number
  refreshWorkspace: () => void
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)
const MobileApiContext = createContext<ReturnType<typeof createMobileApiClient> | null>(null)

function reportAuthDiagnosticsError(error: unknown, context: Record<string, string>) {
  void captureDiagnosticsError(error, {
    eventType: "auth.event",
    category: "auth",
    severity: "warning",
    context
  }).catch(() => {})
}

async function clearStaleStoredSession(error: unknown) {
  reportAuthDiagnosticsError(error, {
    source: "session-bootstrap",
    reason: "stored-session-refresh-failed"
  })

  try {
    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" })

    if (signOutError) {
      reportAuthDiagnosticsError(signOutError, {
        action: "clear-stale-local-session"
      })
    }
  } catch (signOutError) {
    reportAuthDiagnosticsError(signOutError, {
      action: "clear-stale-local-session"
    })
  } finally {
    await supabase.auth.stopAutoRefresh()
  }
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [workspaceVersion, setWorkspaceVersion] = useState(0)
  const [unreadNewLeadsCount, setUnreadNewLeadsCount] = useState(0)
  const api = useMemo(
    () =>
      createMobileApiClient({
        supabase,
        apiBaseUrl: getApiBaseUrl(),
        getAccessToken: async () => {
          const { data } = await supabase.auth.getSession()
          return data.session?.access_token ?? null
        },
        onRequestError: (input) => {
          void reportApiRequestError(input)
        }
      }),
    []
  )

  function refreshWorkspace() {
    setWorkspaceVersion((current) => current + 1)
  }

  useEffect(() => {
    setDiagnosticsApiClient(api)
    void flushDiagnostics()

    return () => {
      setDiagnosticsApiClient(null)
    }
  }, [api])

  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const route = notification.request.content.data?.route

      if (route === "/(app)/new-leads") {
        refreshWorkspace()
      }
    })

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = response.notification.request.content.data?.route

      if (route === "/(app)/new-leads") {
        refreshWorkspace()
        router.push("/new-leads")
      }
    })

    return () => {
      receivedSubscription.remove()
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function bootstrapSession() {
      try {
        const initialUrl = await Linking.getInitialURL()

        if (initialUrl) {
          try {
            await restoreSessionFromUrl(initialUrl)
          } catch (error) {
            void captureDiagnosticsError(error, {
              eventType: "auth.event",
              category: "auth",
              severity: "warning",
              context: {
                phase: "initial-url"
              }
            })
          }
        }

        const { data, error } = await supabase.auth.getSession()

        if (error) {
          await clearStaleStoredSession(error)

          if (isMounted) {
            setSession(null)
          }

          return
        }

        if (!isMounted) {
          return
        }

        setSession(data.session)
      } catch (error) {
        if (isMounted) {
          setSession(null)
        }

        void captureDiagnosticsError(error, {
          eventType: "error.handled",
          category: "error",
          severity: "error",
          context: {
            source: "session-bootstrap"
          }
        })
      } finally {
        if (isMounted) {
          setIsBootstrapping(false)
        }
      }
    }

    bootstrapSession()

    const subscription = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsBootstrapping(false)
    })

    const linkingSubscription = Linking.addEventListener("url", async ({ url }) => {
      try {
        await restoreSessionFromUrl(url)
      } catch (error) {
        void captureDiagnosticsError(error, {
          eventType: "auth.event",
          category: "auth",
          severity: "warning",
          context: {
            phase: "linking-listener"
          }
        })
      }
    })

    return () => {
      isMounted = false
      subscription.data.subscription.unsubscribe()
      linkingSubscription.remove()
    }
  }, [])

  useEffect(() => {
    if (!session) {
      void supabase.auth.stopAutoRefresh()
      return
    }

    function syncAutoRefresh(appState: AppStateStatus) {
      if (appState === "active") {
        void supabase.auth.startAutoRefresh()
        return
      }

      void supabase.auth.stopAutoRefresh()
    }

    syncAutoRefresh(AppState.currentState)

    const subscription = AppState.addEventListener("change", syncAutoRefresh)

    return () => {
      subscription.remove()
      void supabase.auth.stopAutoRefresh()
    }
  }, [session])

  useEffect(() => {
    const agentId = session?.user.id

    if (!agentId) {
      setWorkspaceVersion(0)
      setUnreadNewLeadsCount(0)
      return
    }

    setWorkspaceVersion(0)

    const channel = supabase
      .channel(`mobile-workspace-${agentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
          filter: `agent_id=eq.${agentId}`
        },
        () => {
          setWorkspaceVersion((current) => current + 1)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments"
        },
        () => {
          setWorkspaceVersion((current) => current + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user.id])

  useEffect(() => {
    const agentId = session?.user.id

    if (!agentId) {
      setUnreadNewLeadsCount(0)
      return
    }

    let isMounted = true

    api
      .listNewLeads(agentId)
      .then((leads) => {
        if (isMounted) {
          setUnreadNewLeadsCount(leads.length)
        }
      })
      .catch(() => {
        if (isMounted) {
          setUnreadNewLeadsCount(0)
        }
      })

    return () => {
      isMounted = false
    }
  }, [api, session?.user.id, workspaceVersion])

  useEffect(() => {
    const agentId = session?.user.id

    if (!agentId) {
      return
    }

    let isMounted = true

    async function registerPushToken() {
      try {
        const permissions = await Notifications.getPermissionsAsync()
        const granted =
          permissions.status === "granted"
            ? permissions
            : await Notifications.requestPermissionsAsync()

        if (granted.status !== "granted") {
          return
        }

        const token = await Notifications.getExpoPushTokenAsync()

        if (!isMounted || !token.data) {
          return
        }

        await api.registerPushToken({
          expoPushToken: token.data,
          platform:
            Platform.OS === "ios"
              ? "ios"
              : Platform.OS === "android"
                ? "android"
                : "unknown"
        })
      } catch (error) {
        void captureDiagnosticsError(error, {
          eventType: "notification.event",
          category: "notification",
          severity: "warning",
          context: {
            source: "register-push-token"
          }
        })
      }
    }

    void registerPushToken()

    return () => {
      isMounted = false
    }
  }, [api, session?.user.id])

  async function signOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      void captureDiagnosticsError(error, {
        eventType: "auth.event",
        category: "auth",
        severity: "error",
        context: {
          action: "sign-out"
        }
      })
      throw error
    }

    setSession(null)
  }

  return (
    <SessionContext.Provider
      value={{
        session,
        isBootstrapping,
        workspaceVersion,
        unreadNewLeadsCount,
        refreshWorkspace,
        signOut
      }}
    >
      <MobileApiContext.Provider value={api}>{children}</MobileApiContext.Provider>
    </SessionContext.Provider>
  )
}

export function useSession() {
  const value = useContext(SessionContext)

  if (!value) {
    throw new Error("useSession must be used inside SessionProvider.")
  }

  return value
}

export function useMobileApi() {
  const value = useContext(MobileApiContext)

  if (!value) {
    throw new Error("useMobileApi must be used inside SessionProvider.")
  }

  return value
}
