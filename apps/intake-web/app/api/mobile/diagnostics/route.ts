import { NextResponse } from "next/server"
import {
  DiagnosticsBatchResponseSchema,
  DiagnosticsBatchSchema,
  type DiagnosticsBreadcrumb,
  type DiagnosticsEvent,
  type DiagnosticsMetadata,
  type DiagnosticsMetadataValue
} from "@showready/contracts"
import { ZodError } from "zod"
import { MobileAuthError, requireMobileAgent } from "@/lib/mobile-auth"
import { recordDiagnosticEvents } from "@/lib/supabase/data"

const BLOCKED_CONTEXT_KEYS = [
  "email",
  "phone",
  "address",
  "note",
  "notes",
  "token",
  "password",
  "header",
  "headers",
  "body",
  "response"
]

function isBlockedContextKey(key: string) {
  const normalizedKey = key.toLowerCase()
  return BLOCKED_CONTEXT_KEYS.some((entry) => normalizedKey.includes(entry))
}

function sanitizeDiagnosticsValue(value: DiagnosticsMetadataValue): DiagnosticsMetadataValue | undefined {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value
  }

  if (Array.isArray(value)) {
    const sanitizedItems = value
      .map((item) => sanitizeDiagnosticsValue(item))
      .filter((item): item is DiagnosticsMetadataValue => item !== undefined)

    return sanitizedItems
  }

  const sanitizedEntries = Object.entries(value).reduce<DiagnosticsMetadata>((result, [key, entryValue]) => {
    if (isBlockedContextKey(key)) {
      return result
    }

    const sanitizedValue = sanitizeDiagnosticsValue(entryValue)

    if (sanitizedValue !== undefined) {
      result[key] = sanitizedValue
    }

    return result
  }, {})

  return sanitizedEntries
}

function sanitizeDiagnosticsMetadata(metadata: DiagnosticsMetadata | undefined) {
  if (!metadata) {
    return {}
  }

  const sanitizedValue = sanitizeDiagnosticsValue(metadata)

  if (!sanitizedValue || Array.isArray(sanitizedValue) || typeof sanitizedValue !== "object") {
    return {}
  }

  return sanitizedValue
}

function sanitizeBreadcrumb(breadcrumb: DiagnosticsBreadcrumb): DiagnosticsBreadcrumb {
  return {
    ...breadcrumb,
    data: sanitizeDiagnosticsMetadata(breadcrumb.data)
  }
}

function sanitizeDiagnosticsEvent(event: DiagnosticsEvent): DiagnosticsEvent {
  return {
    ...event,
    context: sanitizeDiagnosticsMetadata(event.context),
    breadcrumbs: event.breadcrumbs.map((breadcrumb) => sanitizeBreadcrumb(breadcrumb))
  }
}

function getValidationErrorMessage(error: ZodError) {
  return error.issues[0]?.message ?? "Invalid diagnostics payload."
}

export async function POST(request: Request) {
  try {
    const { agentId, client } = await requireMobileAgent(request)
    const payload = DiagnosticsBatchSchema.parse(await request.json())
    const sanitizedEvents = payload.events.map((event) => sanitizeDiagnosticsEvent(event))
    const result = await recordDiagnosticEvents(client, agentId, sanitizedEvents)

    return NextResponse.json(DiagnosticsBatchResponseSchema.parse(result), {
      status: 202
    })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof ZodError) {
      return NextResponse.json({ error: getValidationErrorMessage(error) }, { status: 400 })
    }

    return NextResponse.json({ error: "Unable to record diagnostics." }, { status: 400 })
  }
}
