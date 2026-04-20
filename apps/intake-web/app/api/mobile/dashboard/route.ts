import { NextResponse } from "next/server"
import { loadDashboardSummary } from "@showready/application"
import { DashboardSummarySchema } from "@showready/contracts"
import { MobileAuthError, requireMobileAgent } from "@/lib/mobile-auth"
import { getAnalyticsSummary } from "@/lib/supabase/data"

export async function GET(request: Request) {
  try {
    const { agentId, client } = await requireMobileAgent(request)
    const summary = await loadDashboardSummary({
      getDashboardSummary: () => getAnalyticsSummary(client, agentId)
    })

    return NextResponse.json(DashboardSummarySchema.parse(summary))
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to load dashboard summary." }, { status: 400 })
  }
}
