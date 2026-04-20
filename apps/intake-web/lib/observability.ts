export function captureServerError(error: unknown, context: string) {
  console.error(`[showready:${context}]`, error)
}
