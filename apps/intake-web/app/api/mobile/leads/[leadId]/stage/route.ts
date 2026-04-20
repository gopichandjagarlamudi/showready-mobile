import { NextResponse } from "next/server"
import { LeadStageMutationSchema } from "@showready/contracts"
import { MobileAuthError, requireMobileAgent } from "@/lib/mobile-auth"
import { updateLeadStage } from "@/lib/supabase/data"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params
    const { agentId, client } = await requireMobileAgent(request)
    const payload = LeadStageMutationSchema.parse(await request.json())
    const lead = await updateLeadStage(client, agentId, leadId, payload.pipelineStage)

    return NextResponse.json({ lead })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to move lead." }, { status: 400 })
  }
}
