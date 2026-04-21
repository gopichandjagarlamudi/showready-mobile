import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { PropsWithChildren } from "react"
import * as Linking from "expo-linking"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import type { Session } from "@supabase/supabase-js"
import { router } from "expo-router"
import { createMobileApiClient } from "@showready/infrastructure"
import { restoreSessionFromUrl } from "../lib/auth-oauth"
import { getApiBaseUrl } from "../lib/env"
import { supabase } from "../lib/supabase"

type SessionContextValue = {
  session: Session | null
  isBootstrapping: boolean
  workspaceVersion: number
  unreadNewLeadsCount: number
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)
const MobileApiContext = createContext<ReturnType<typeof createMobileApiClient> | null>(null)

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
        }
      }),
    []
  )

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = response.notification.request.content.data?.route

      if (route === "/(app)/new-leads") {
        router.push("/new-leads")
      }
    })

    return () => {
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
          } catch {
            // Ignore malformed callback URLs and keep the current session state.
          }
        }

        const { data } = await supabase.auth.getSession()

        if (!isMounted) {
          return
        }

        setSession(data.session)
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
      } catch {
        // Ignore callback noise and rely on the existing session state.
      }
    })

    return () => {
      isMounted = false
      subscription.data.subscription.unsubscribe()
      linkingSubscription.remove()
    }
  }, [])

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
      } catch {
        // Notification registration should never block app usage.
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
      throw error
    }

    setSession(null)
  }

  return (
    <SessionContext.Provider
      value={{ session, isBootstrapping, workspaceVersion, unreadNewLeadsCount, signOut }}
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
