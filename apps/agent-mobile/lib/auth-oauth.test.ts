describe("auth oauth helpers", () => {
  beforeEach(() => {
    jest.resetModules()
    jest.unmock("expo-constants")
    jest.unmock("expo-auth-session")
    jest.unmock("expo-web-browser")
  })

  it("detects auth callback urls", () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "anon-key"
    process.env.EXPO_PUBLIC_API_BASE_URL = "http://localhost:3000"

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isAuthCallbackUrl } = require("./auth-oauth")

    expect(isAuthCallbackUrl("showready://auth/callback?code=123")).toBe(true)
    expect(isAuthCallbackUrl("showready://dashboard")).toBe(false)
  })

  it("builds the native showready callback url for OAuth", () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "anon-key"
    process.env.EXPO_PUBLIC_API_BASE_URL = "http://localhost:3000"
    const makeRedirectUri = jest.fn(() => "showready://auth/callback")

    jest.doMock("expo-auth-session", () => ({
      makeRedirectUri
    }))
    jest.doMock("expo-web-browser", () => ({
      maybeCompleteAuthSession: jest.fn(),
      openAuthSessionAsync: jest.fn()
    }))

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getGoogleRedirectUrl } = require("./auth-oauth")

    expect(getGoogleRedirectUrl()).toBe("showready://auth/callback")
    expect(makeRedirectUri).toHaveBeenCalledWith({
      scheme: "showready",
      path: "auth/callback",
      native: "showready://auth/callback"
    })
  })

  it("fails fast in Expo Go before starting Google OAuth", async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "anon-key"
    process.env.EXPO_PUBLIC_API_BASE_URL = "http://localhost:3000"

    jest.doMock("expo-constants", () => ({
      __esModule: true,
      default: {
        appOwnership: "expo"
      }
    }))
    jest.doMock("expo-auth-session", () => ({
      makeRedirectUri: jest.fn(() => "showready://auth/callback")
    }))
    jest.doMock("expo-web-browser", () => ({
      maybeCompleteAuthSession: jest.fn(),
      openAuthSessionAsync: jest.fn()
    }))

    const signInWithOAuth = jest.fn()

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { signInWithGoogle } = require("./auth-oauth")

    const result = await signInWithGoogle({
      auth: {
        signInWithOAuth
      }
    })

    expect(result).toEqual({
      type: "error",
      message:
        "Google sign-in requires a development build or standalone app. Expo Go cannot complete OAuth redirects for this flow."
    })
    expect(signInWithOAuth).not.toHaveBeenCalled()
  })
})
