import { NextResponse } from "next/server"
import { loadDashboardSummary } from "@showready/application"
import { DashboardSummarySchema } from "@showready/contracts"
import { MobileAuthError, requireMobileAgent } from "@/lib/mobile-auth"
import { requestErrorResponse } from "@/lib/observability"
import { getAnalyticsSummary } from "@/lib/supabase/data"

export async function GET(request: Request) {
  let agentId: string | undefined

  try {
    const auth = await requireMobileAgent(request)
    agentId = auth.agentId
    const authenticatedAgentId = auth.agentId
    const summary = await loadDashboardSummary({
      getDashboardSummary: () => getAnalyticsSummary(auth.client, authenticatedAgentId)
    })

    return NextResponse.json(DashboardSummarySchema.parse(summary))
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return requestErrorResponse({
        request,
        error,
        route: "api.mobile.dashboard",
        status: error.status,
        response: { error: error.message },
        headers: error.headers
      })
    }

    return requestErrorResponse({
      request,
      error,
      route: "api.mobile.dashboard",
      status: 400,
      agentId,
      response: { error: "Unable to load dashboard summary." }
    })
  }
}
