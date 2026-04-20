const fs = require("node:fs")
const path = require("node:path")
const { createClient } = require("@supabase/supabase-js")

const DEMO_EMAIL = "demo@showready.local"
const DEMO_PASSWORD = "demo12345"

function loadLocalEnv() {
  const envPath = path.join(__dirname, "..", "..", "..", ".env.local")
  const contents = fs.readFileSync(envPath, "utf8")

  for (const line of contents.split("\n")) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const separatorIndex = trimmed.indexOf("=")
    if (separatorIndex < 0) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

function requireEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

async function main() {
  loadLocalEnv()

  const appUrl = requireEnv("APP_URL")
  const client = createClient(
    requireEnv("EXPO_PUBLIC_SUPABASE_URL"),
    requireEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { data, error } = await client.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD
  })

  if (error || !data.session) {
    throw error ?? new Error("Unable to resolve a Supabase session for Maestro.")
  }

  console.log(
    `${appUrl}/--/auth/callback?access_token=${encodeURIComponent(
      data.session.access_token
    )}&refresh_token=${encodeURIComponent(data.session.refresh_token)}`
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
