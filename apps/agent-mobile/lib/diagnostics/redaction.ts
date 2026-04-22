import type { DiagnosticsMetadata, DiagnosticsMetadataValue } from "@showready/contracts"

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
    return value
      .map((entry) => sanitizeDiagnosticsValue(entry))
      .filter((entry): entry is DiagnosticsMetadataValue => entry !== undefined)
  }

  return Object.entries(value).reduce<DiagnosticsMetadata>((result, [key, entryValue]) => {
    if (isBlockedContextKey(key)) {
      return result
    }

    const sanitizedValue = sanitizeDiagnosticsValue(entryValue)

    if (sanitizedValue !== undefined) {
      result[key] = sanitizedValue
    }

    return result
  }, {})
}

export function sanitizeDiagnosticsMetadata(metadata: DiagnosticsMetadata | undefined): DiagnosticsMetadata {
  if (!metadata) {
    return {}
  }

  const sanitizedValue = sanitizeDiagnosticsValue(metadata)

  if (!sanitizedValue || Array.isArray(sanitizedValue) || typeof sanitizedValue !== "object") {
    return {}
  }

  return sanitizedValue
}
