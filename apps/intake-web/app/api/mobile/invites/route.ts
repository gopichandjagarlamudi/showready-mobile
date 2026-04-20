import { NextResponse } from "next/server"
import { createInviteLink } from "@showready/application"
import { serializeInviteResponse } from "@/lib/invite-response"
import { MobileAuthError, requireMobileAgent } from "@/lib/mobile-auth"
import { createInvite } from "@/lib/supabase/data"
import { buildAppUrl } from "@/lib/utils"

export async function POST(request: Request) {
  try {
    const { agentId, client } = await requireMobileAgent(request)
    const payload = await createInviteLink({
      createInvite: async () => {
        const invite = await createInvite(client, agentId)

        return serializeInviteResponse({
          token: invite.token,
          tokenExpiresAt: invite.tokenExpiresAt,
          appUrl: buildAppUrl("", { request })
        })
      }
    })

    return NextResponse.json(payload, {
      status: 201
    })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to create invite." }, { status: 400 })
  }
}
