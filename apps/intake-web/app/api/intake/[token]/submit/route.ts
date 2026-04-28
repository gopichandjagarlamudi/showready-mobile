import { NextResponse } from "next/server"
import { submitIntakeDraft } from "@showready/application"
import type { IntakeDraft } from "@showready/contracts"
import { trackServerEvent } from "@/lib/analytics"
import { sendLeadScoredEmail, sendLeadScoredPushNotifications } from "@/lib/notifications"
import { captureServerError } from "@/lib/observability"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { getAgentContext, listAgentPushTokens, submitInvite } from "@/lib/supabase/data"
import { buildAppUrl } from "@/lib/utils"

async function runSubmitSideEffect(label: string, operation: () => Promise<void>) {
  try {
    await operation()
  } catch (error) {
    captureServerError(error, `api.intake.submit.${label}`)
  }
}

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
    let context: Awaited<ReturnType<typeof getAgentContext>> | null = null
    let pushTokens: string[] = []

    await runSubmitSideEffect("agent_context", async () => {
      context = await getAgentContext(supabase, lead.agentId)
    })

    await runSubmitSideEffect("push_tokens", async () => {
      pushTokens = await listAgentPushTokens(supabase, lead.agentId)
    })

    await runSubmitSideEffect("push_notifications", async () => {
      await sendLeadScoredPushNotifications({
        expoPushTokens: pushTokens,
        title: "New lead submitted",
        body: `${lead.buyerName} just submitted the intake form.`,
        data: {
          leadId: lead.id,
          route: "/(app)/new-leads"
        }
      })
    })

    await runSubmitSideEffect("email", async () => {
      if (!context?.agent.email || !context.settings.emailNotificationsEnabled) {
        return
      }

      await sendLeadScoredEmail({
        to: context.agent.email,
        agentName: context.agent.fullName,
        buyerName: lead.buyerName,
        recommendation: lead.recommendation ?? "nurture",
        score: lead.score ?? 0,
        detailUrl: buildAppUrl(`/leads/${lead.id}`, { request })
      })
    })

    await runSubmitSideEffect("analytics", async () => {
      await trackServerEvent("intake.submitted", { recommendation: lead.recommendation ?? "nurture" }, lead.agentId)
    })

    return NextResponse.json({ lead })
  } catch (error) {
    captureServerError(error, "api.intake.submit")
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit intake." },
      { status: 400 }
    )
  }
}
