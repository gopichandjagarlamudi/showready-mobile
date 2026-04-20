import { NextResponse } from "next/server"
import { submitIntakeDraft } from "@showready/application"
import type { IntakeDraft } from "@showready/contracts"
import { trackServerEvent } from "@/lib/analytics"
import { sendLeadScoredEmail } from "@/lib/notifications"
import { captureServerError } from "@/lib/observability"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { getAgentContext, submitInvite } from "@/lib/supabase/data"
import { buildAppUrl } from "@/lib/utils"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  try {
    const supabase = createSupabaseAdminClient()
    const payload = (await request.json()) as { draft: IntakeDraft }
    const { lead } = await submitIntakeDraft(
      {
        submitDraft: (inviteToken, draft) => submitInvite(supabase, inviteToken, { draft })
      },
      token,
      payload.draft
    )
    const context = await getAgentContext(supabase, lead.agentId)

    if (context?.agent.email) {
      await sendLeadScoredEmail({
        to: context.agent.email,
        agentName: context.agent.fullName,
        buyerName: lead.buyerName,
        recommendation: lead.recommendation ?? "nurture",
        score: lead.score ?? 0,
        detailUrl: buildAppUrl(`/leads/${lead.id}`, { request })
      })
    }

    await trackServerEvent("intake.submitted", { recommendation: lead.recommendation ?? "nurture" }, lead.agentId)

    return NextResponse.json({ lead })
  } catch (error) {
    captureServerError(error, "api.intake.submit")
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit intake." },
      { status: 400 }
    )
  }
}
