import { Redirect } from "expo-router"
import { LoadingScreen } from "../components/loading-screen"
import { useSession } from "../providers/session-provider"

export default function IndexRoute() {
  const { session, isBootstrapping } = useSession()

  if (isBootstrapping) {
    return <LoadingScreen />
  }

  if (session) {
    return <Redirect href="/(app)/home" />
  }

  return <Redirect href={"/(auth)/sign-in" as never} />
}
