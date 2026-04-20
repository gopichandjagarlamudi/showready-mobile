export async function sendLeadScoredEmail(payload: {
  to: string
  agentName: string
  buyerName: string
  recommendation: string
  score: number
  detailUrl: string
}) {
  if (!process.env.LEAD_NOTIFICATION_WEBHOOK_URL) {
    return { skipped: true }
  }

  await fetch(process.env.LEAD_NOTIFICATION_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })

  return { skipped: false }
}
