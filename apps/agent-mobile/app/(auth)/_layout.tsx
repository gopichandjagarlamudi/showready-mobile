import { Redirect, Stack } from "expo-router"
import { useSession } from "../../providers/session-provider"

export default function AuthLayout() {
  const { session, isBootstrapping } = useSession()

  if (!isBootstrapping && session) {
    return <Redirect href="/(app)/home" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
