import Constants from "expo-constants"

export function getSupabaseUrl() {
  const value = process.env.EXPO_PUBLIC_SUPABASE_URL

  if (!value) {
    throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL.")
  }

  return value
}

export function getSupabaseAnonKey() {
  const value = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

  if (!value) {
    throw new Error("Missing EXPO_PUBLIC_SUPABASE_ANON_KEY.")
  }

  return value
}

function getExpoHostUri() {
  return (
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    Constants.platform?.hostUri ??
    null
  )
}

function extractExpoHostname(hostUri: string) {
  try {
    const normalizedHostUri = hostUri.includes("://") ? hostUri : `http://${hostUri}`
    return new URL(normalizedHostUri).hostname
  } catch {
    return null
  }
}

export function resolveApiBaseUrl(value: string, expoHostUri = getExpoHostUri()) {
  const normalizedValue = value.replace(/\/+$/, "")

  try {
    const resolvedUrl = new URL(normalizedValue)

    if (!["localhost", "127.0.0.1"].includes(resolvedUrl.hostname) || !expoHostUri) {
      return normalizedValue
    }

    const expoHostname = extractExpoHostname(expoHostUri)

    if (!expoHostname) {
      return normalizedValue
    }

    resolvedUrl.hostname = expoHostname
    return resolvedUrl.toString().replace(/\/+$/, "")
  } catch {
    return normalizedValue
  }
}

export function getApiBaseUrl(expoHostUri = getExpoHostUri()) {
  const value = process.env.EXPO_PUBLIC_API_BASE_URL

  if (!value) {
    throw new Error("Missing EXPO_PUBLIC_API_BASE_URL.")
  }

  return resolveApiBaseUrl(value, expoHostUri)
}
