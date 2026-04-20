import { NextResponse } from "next/server"
import { z } from "zod"
import { MobileAuthError, requireMobileAgent } from "@/lib/mobile-auth"
import { overrideLeadScore } from "@/lib/supabase/data"

const OverrideSchema = z.object({
  overrideScore: z.number().min(0).max(10),
  note: z.string().min(1)
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params
    const { agentId, client } = await requireMobileAgent(request)
    const payload = OverrideSchema.parse(await request.json())
    const lead = await overrideLeadScore(client, agentId, leadId, payload.overrideScore, payload.note)

    return NextResponse.json({ lead })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to override score." }, { status: 400 })
  }
}
