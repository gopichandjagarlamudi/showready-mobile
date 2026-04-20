import { createClient } from "@supabase/supabase-js"
import { createSupabaseAdminClient } from "./supabase/admin"
import { getSupabaseAnonKey, getSupabaseUrl } from "./supabase/env"
import { ensureAgentScaffold } from "./supabase/data"

export class MobileAuthError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function requireMobileAgent(request: Request) {
  const authorization = request.headers.get("authorization")

  if (!authorization?.startsWith("Bearer ")) {
    throw new MobileAuthError(401, "Missing bearer token.")
  }

  const token = authorization.slice("Bearer ".length)
  const admin = createSupabaseAdminClient()
  const {
    data: { user },
    error
  } = await admin.auth.getUser(token)

  if (error || !user) {
    throw new MobileAuthError(401, "Invalid access token.")
  }

  await ensureAgentScaffold(admin, user)

  const client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return {
    agentId: user.id,
    client,
    user
  }
}
