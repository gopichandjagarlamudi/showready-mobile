import { NextResponse } from "next/server"
import {
  PipelineLeadListQuerySchema,
  PipelineLeadListResponseSchema
} from "@showready/contracts"
import { MobileAuthError, requireMobileAgent } from "@/lib/mobile-auth"
import { requestErrorResponse } from "@/lib/observability"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { listPipelineLeads } from "@/lib/supabase/data"

export async function GET(request: Request) {
  let agentId: string | undefined

  try {
    const auth = await requireMobileAgent(request)
    agentId = auth.agentId
    const { searchParams } = new URL(request.url)
    const query = PipelineLeadListQuerySchema.parse(Object.fromEntries(searchParams.entries()))
    const result = await listPipelineLeads(createSupabaseAdminClient(), agentId, query)

    return NextResponse.json(PipelineLeadListResponseSchema.parse(result))
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return requestErrorResponse({
        request,
        error,
        route: "api.mobile.pipeline.leads",
        status: error.status,
        response: { error: error.message },
        headers: error.headers
      })
    }

    return requestErrorResponse({
      request,
      error,
      route: "api.mobile.pipeline.leads",
      status: 400,
      agentId,
      response: { error: "Unable to load pipeline leads." }
    })
  }
}
