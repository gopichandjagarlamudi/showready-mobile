import { NextResponse } from "next/server"
import { MobileAuthError, requireMobileAgent } from "@/lib/mobile-auth"
import { getLeadById } from "@/lib/supabase/data"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params
    const { agentId, client } = await requireMobileAgent(request)
    const lead = await getLeadById(client, agentId, leadId)

    if (!lead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 })
    }

    return NextResponse.json({ lead })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to load lead." }, { status: 400 })
  }
}
