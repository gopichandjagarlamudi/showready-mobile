import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { PropsWithChildren } from "react"
import * as Linking from "expo-linking"
import type { Session } from "@supabase/supabase-js"
import { createMobileApiClient } from "@showready/infrastructure"
import { restoreSessionFromUrl } from "../lib/auth-oauth"
import { getApiBaseUrl } from "../lib/env"
import { supabase } from "../lib/supabase"

type SessionContextValue = {
  session: Session | null
  isBootstrapping: boolean
}

const SessionContext = createContext<SessionContextValue | null>(null)
const MobileApiContext = createContext<ReturnType<typeof createMobileApiClient> | null>(null)

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
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

  return (
    <SessionContext.Provider value={{ session, isBootstrapping }}>
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
