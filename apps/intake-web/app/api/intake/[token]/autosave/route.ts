import { NextResponse } from "next/server"
import { autosaveIntakeStep } from "@showready/application"
import type { IntakeDraft } from "@showready/contracts"
import { captureServerError } from "@/lib/observability"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { autosaveInviteDraft } from "@/lib/supabase/data"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  try {
    const supabase = createSupabaseAdminClient()
    const payload = (await request.json()) as { draft: IntakeDraft }
    await autosaveIntakeStep(
      {
        autosaveDraft: (inviteToken, draft) =>
          autosaveInviteDraft(supabase, inviteToken, draft).then(() => ({ ok: true as const }))
      },
      token,
      payload.draft
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    captureServerError(error, "api.intake.autosave")
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save answer." },
      { status: 400 }
    )
  }
}
