describe("auth oauth helpers", () => {
  it("detects auth callback urls", () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "anon-key"
    process.env.EXPO_PUBLIC_API_BASE_URL = "http://localhost:3000"

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isAuthCallbackUrl } = require("./auth-oauth")

    expect(isAuthCallbackUrl("showready://auth/callback?code=123")).toBe(true)
    expect(isAuthCallbackUrl("showready://dashboard")).toBe(false)
  })
})
