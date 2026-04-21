import { z } from "zod"
import { NextResponse } from "next/server"
import { MobileAuthError, requireMobileAgent } from "@/lib/mobile-auth"
import { registerAgentPushToken } from "@/lib/supabase/data"

const PushTokenSchema = z.object({
  expoPushToken: z.string().min(1),
  platform: z.enum(["ios", "android", "unknown"])
})

export async function POST(request: Request) {
  try {
    const { agentId, client } = await requireMobileAgent(request)
    const payload = PushTokenSchema.parse(await request.json())

    await registerAgentPushToken(client, agentId, payload)

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to register push token." }, { status: 400 })
  }
}
