import { LeadListQuerySchema } from "@showready/contracts"
import { MobileAuthError, requireMobileAgent } from "@/lib/mobile-auth"
import { requestErrorResponse } from "@/lib/observability"
import { createRouteTiming, jsonWithRouteTiming } from "@/lib/route-timing"
import { listLeads } from "@/lib/supabase/data"

export async function GET(request: Request) {
  let agentId: string | undefined
  const timing = createRouteTiming()

  try {
    const auth = await timing.measure("auth", () => requireMobileAgent(request))
    agentId = auth.agentId
    const authenticatedAgentId = auth.agentId
    const { searchParams } = new URL(request.url)
    const query = LeadListQuerySchema.parse(Object.fromEntries(searchParams.entries()))
    const result = await timing.measure("data", () => listLeads(auth.client, authenticatedAgentId, query))

    return jsonWithRouteTiming(result, timing)
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return requestErrorResponse({
        request,
        error,
        route: "api.mobile.leads",
        status: error.status,
        response: { error: error.message },
        headers: error.headers
      })
    }

    return requestErrorResponse({
      request,
      error,
      route: "api.mobile.leads",
      status: 400,
      agentId,
      response: { error: "Unable to load leads." }
    })
  }
}
