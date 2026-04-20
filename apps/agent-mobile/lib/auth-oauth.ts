import { makeRedirectUri } from "expo-auth-session"
import * as QueryParams from "expo-auth-session/build/QueryParams"
import * as WebBrowser from "expo-web-browser"
import { supabase } from "./supabase"

type OAuthClient = Pick<typeof supabase, "auth">

export type GoogleSignInResult =
  | { type: "success" }
  | { type: "cancel" }
  | { type: "error"; message: string }

WebBrowser.maybeCompleteAuthSession()

export function isAuthCallbackUrl(url: string) {
  return url.includes("auth/callback")
}

export function getGoogleRedirectUrl() {
  return makeRedirectUri({
    path: "auth/callback"
  })
}

export async function restoreSessionFromUrl(
  url: string,
  client: OAuthClient = supabase
) {
  if (!isAuthCallbackUrl(url)) {
    return false
  }

  const { params, errorCode } = QueryParams.getQueryParams(url)

  if (errorCode) {
    throw new Error(errorCode)
  }

  const accessToken = params.access_token
  const refreshToken = params.refresh_token

  if (accessToken && refreshToken) {
    const { error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })

    if (error) {
      throw error
    }

    return true
  }

  const authCode = params.code
  if (authCode && "exchangeCodeForSession" in client.auth) {
    const exchangeCodeForSession = client.auth.exchangeCodeForSession as
      | ((code: string) => Promise<{ error: Error | null }>)
      | undefined

    if (exchangeCodeForSession) {
      const { error } = await exchangeCodeForSession(authCode)

      if (error) {
        throw error
      }

      return true
    }
  }

  throw new Error("The Google sign-in callback did not include a usable session.")
}

export async function signInWithGoogle(
  client: OAuthClient = supabase
): Promise<GoogleSignInResult> {
  const redirectTo = getGoogleRedirectUrl()
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true
    }
  })

  if (error || !data?.url) {
    return {
      type: "error",
      message: error?.message ?? "Unable to start Google sign-in right now."
    }
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

  if (result.type === "cancel" || result.type === "dismiss") {
    return { type: "cancel" }
  }

  if (result.type !== "success" || !("url" in result) || !result.url) {
    return {
      type: "error",
      message: "Unable to complete Google sign-in right now."
    }
  }

  try {
    await restoreSessionFromUrl(result.url, client)
    return { type: "success" }
  } catch (restoreError) {
    return {
      type: "error",
      message:
        restoreError instanceof Error
          ? restoreError.message
          : "Unable to complete Google sign-in right now."
    }
  }
}
