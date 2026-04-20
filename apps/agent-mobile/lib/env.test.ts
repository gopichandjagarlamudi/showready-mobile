import { getApiBaseUrl, resolveApiBaseUrl } from "./env"

describe("env helpers", () => {
  const originalEnv = process.env.EXPO_PUBLIC_API_BASE_URL

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.EXPO_PUBLIC_API_BASE_URL
      return
    }

    process.env.EXPO_PUBLIC_API_BASE_URL = originalEnv
  })

  it("replaces localhost with the Expo host for device testing", () => {
    expect(resolveApiBaseUrl("http://localhost:3000", "192.168.5.13:8081")).toBe(
      "http://192.168.5.13:3000"
    )
  })

  it("keeps non-local api hosts unchanged", () => {
    expect(resolveApiBaseUrl("https://showready.example.com", "192.168.5.13:8081")).toBe(
      "https://showready.example.com"
    )
  })

  it("uses the configured env var when reading the mobile api base url", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "http://localhost:3000/"

    expect(getApiBaseUrl("192.168.5.13:8081")).toBe("http://192.168.5.13:3000")
  })
})
