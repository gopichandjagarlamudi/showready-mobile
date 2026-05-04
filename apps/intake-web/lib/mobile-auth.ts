import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import {
  consumeRateLimit,
  getClientIp,
  getDefaultRateLimitStore,
  resetDefaultRateLimitStore,
  type RateLimitHeaders
} from "./rate-limit"
import { createSupabaseAdminClient } from "./supabase/admin"
import { getSupabaseAnonKey, getSupabaseUrl } from "./supabase/env"
import { ensureAgentScaffold } from "./supabase/data"

export class MobileAuthError extends Error {
  status: number
  headers?: RateLimitHeaders

  constructor(status: number, message: string, headers?: RateLimitHeaders) {
    super(message)
    this.status = status
    this.headers = headers
  }
}

const WINDOW_MS = 60_000
const DEFAULT_PRE_AUTH_LIMIT = 120
const DEFAULT_USER_LIMIT = 120

function readPositiveIntegerEnv(name: string, fallback: number) {
  const value = process.env[name]
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeMobilePath(pathname: string) {
  return pathname
    .replace(/\/api\/mobile\/leads\/[^/]+\/override-score$/, "/api/mobile/leads/:leadId/override-score")
    .replace(/\/api\/mobile\/leads\/[^/]+\/stage$/, "/api/mobile/leads/:leadId/stage")
    .replace(/\/api\/mobile\/leads\/[^/]+$/, "/api/mobile/leads/:leadId")
    .replace(
      /\/api\/mobile\/appointments\/[^/]+\/status$/,
      "/api/mobile/appointments/:appointmentId/status"
    )
}

function getRouteKey(request: Request) {
  const url = new URL(request.url)
  return `${request.method}:${normalizeMobilePath(url.pathname)}`
}

function getUserLimit(request: Request) {
  const routeKey = getRouteKey(request)

  if (routeKey === "POST:/api/mobile/invites") {
    return readPositiveIntegerEnv("MOBILE_RATE_LIMIT_INVITES_PER_MINUTE", 10)
  }

  if (routeKey === "POST:/api/mobile/diagnostics") {
    return readPositiveIntegerEnv("MOBILE_RATE_LIMIT_DIAGNOSTICS_PER_MINUTE", 30)
  }

  return readPositiveIntegerEnv("MOBILE_RATE_LIMIT_USER_PER_MINUTE", DEFAULT_USER_LIMIT)
}

async function enforceRateLimit(input: {
  key: string
  limit: number
  now: number
}) {
  const result = await consumeRateLimit(getDefaultRateLimitStore(), {
    key: input.key,
    limit: input.limit,
    windowMs: WINDOW_MS,
    now: input.now
  })

  if (!result.allowed) {
    throw new MobileAuthError(
      429,
      "Too many mobile API requests. Please try again shortly.",
      result.headers
    )
  }
}

async function enforcePreAuthRateLimit(request: Request) {
  const now = Date.now()
  const ip = getClientIp(request)
  const routeKey = getRouteKey(request)
  const limit = readPositiveIntegerEnv(
    "MOBILE_RATE_LIMIT_PRE_AUTH_PER_MINUTE",
    DEFAULT_PRE_AUTH_LIMIT
  )

  await enforceRateLimit({
    key: `mobile:pre-auth:ip:${ip}`,
    limit,
    now
  })
  await enforceRateLimit({
    key: `mobile:pre-auth:route:${routeKey}:ip:${ip}`,
    limit,
    now
  })
}

async function enforceAuthenticatedRateLimit(request: Request, userId: string) {
  const now = Date.now()
  const ip = getClientIp(request)
  const routeKey = getRouteKey(request)
  const limit = getUserLimit(request)

  await enforceRateLimit({
    key: `mobile:auth:user:${userId}:route:${routeKey}`,
    limit,
    now
  })
  await enforceRateLimit({
    key: `mobile:auth:ip:${ip}:route:${routeKey}`,
    limit,
    now
  })
}

export function resetMobileRateLimits() {
  resetDefaultRateLimitStore()
}

export function mobileErrorResponse(error: MobileAuthError) {
  return NextResponse.json(
    { error: error.message },
    { status: error.status, headers: error.headers }
  )
}

export async function requireMobileAgent(request: Request) {
  await enforcePreAuthRateLimit(request)

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

  await enforceAuthenticatedRateLimit(request, user.id)
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
