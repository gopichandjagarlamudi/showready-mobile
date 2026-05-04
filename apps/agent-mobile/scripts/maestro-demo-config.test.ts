const {
  buildMaestroAuthUrlOutput,
  buildMaskedAuthCallbackUrl,
  resolveDemoCredentials
} = require("./maestro-demo-config.cjs")

describe("maestro demo config", () => {
  it("requires demo credentials from environment variables", () => {
    expect(() => resolveDemoCredentials({})).toThrow("Missing MAESTRO_DEMO_EMAIL.")
    expect(() =>
      resolveDemoCredentials({
        MAESTRO_DEMO_EMAIL: "demo@showready.local"
      })
    ).toThrow("Missing MAESTRO_DEMO_PASSWORD.")
  })

  it("redacts auth callback tokens for logs", () => {
    expect(
      buildMaskedAuthCallbackUrl("showready://auth/callback", {
        access_token: "access-token",
        refresh_token: "refresh-token"
      })
    ).toBe(
      "showready://auth/callback?access_token=%5Bredacted%5D&refresh_token=%5Bredacted%5D"
    )
  })

  it("keeps the full auth callback URL on stdout for Maestro command substitution", () => {
    const output = buildMaestroAuthUrlOutput(
      "showready://auth/callback",
      {
        access_token: "access-token",
        refresh_token: "refresh-token"
      },
      "apps/agent-mobile/.maestro-auth-url"
    )

    expect(output.stdout).toBe(
      "showready://auth/callback?access_token=access-token&refresh_token=refresh-token"
    )
    expect(output.fullUrl).toBe(output.stdout)
    expect(output.stderr).toContain(
      "showready://auth/callback?access_token=%5Bredacted%5D&refresh_token=%5Bredacted%5D"
    )
    expect(output.stderr).toContain("apps/agent-mobile/.maestro-auth-url")
  })
})
