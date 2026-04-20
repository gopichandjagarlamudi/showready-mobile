import { NextResponse } from "next/server"
import { MobileAuthError, requireMobileAgent } from "@/lib/mobile-auth"
import { listLeads, listNewLeadsForReview } from "@/lib/supabase/data"

export async function GET(request: Request) {
  try {
    const { agentId, client } = await requireMobileAgent(request)
    const { searchParams } = new URL(request.url)
    const scope = searchParams.get("scope")
    const leads =
      scope === "new"
        ? await listNewLeadsForReview(client, agentId)
        : await listLeads(client, agentId)

    return NextResponse.json({ leads })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to load leads." }, { status: 400 })
  }
}
