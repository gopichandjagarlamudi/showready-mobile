import { NextResponse } from "next/server"
import { reviewLeadSubmission } from "@showready/application"
import { ReviewLeadSchema } from "@showready/contracts"
import { MobileAuthError, requireMobileAgent } from "@/lib/mobile-auth"
import { reviewLead } from "@/lib/supabase/data"

export async function POST(request: Request) {
  try {
    const { agentId, client } = await requireMobileAgent(request)
    const payload = ReviewLeadSchema.parse(await request.json())
    const lead = await reviewLeadSubmission(
      {
        reviewLead: (leadId, pipelineStage) =>
          reviewLead(client, agentId, leadId, pipelineStage)
      },
      payload.leadId,
      payload.pipelineStage
    )

    return NextResponse.json({ lead })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to review lead." }, { status: 400 })
  }
}
