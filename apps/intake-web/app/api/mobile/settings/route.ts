import { NextResponse } from "next/server"
import { saveSettingsProfile } from "@showready/application"
import { SettingsMutationSchema } from "@showready/contracts"
import { MobileAuthError, requireMobileAgent } from "@/lib/mobile-auth"
import { completeOnboarding, getAgentContext } from "@/lib/supabase/data"

export async function GET(request: Request) {
  try {
    const { agentId, client } = await requireMobileAgent(request)
    const context = await getAgentContext(client, agentId)

    if (!context) {
      return NextResponse.json({ error: "Agent settings not found." }, { status: 404 })
    }

    return NextResponse.json({
      fullName: context.agent.fullName,
      brokerage: context.agent.brokerage,
      licenseNumber: context.agent.licenseNumber,
      notificationPreference: context.settings.notificationPreference,
      brandName: context.settings.brandName,
      brandColor: context.settings.brandColor,
      accentColor: context.settings.accentColor,
      showThreshold: context.settings.showThreshold
    })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to load settings." }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  try {
    const { agentId, client } = await requireMobileAgent(request)
    const payload = SettingsMutationSchema.parse(await request.json())
    const existingContext = await getAgentContext(client, agentId)

    if (!existingContext) {
      return NextResponse.json({ error: "Agent settings are not ready yet." }, { status: 404 })
    }

    await saveSettingsProfile(
      {
        saveSettings: async (input) => {
          await completeOnboarding(client, agentId, {
            ...input,
            brandName: existingContext.settings.brandName,
            brandColor: existingContext.settings.brandColor,
            accentColor: existingContext.settings.accentColor,
            showThreshold: existingContext.settings.showThreshold,
            intakeType: existingContext.template.intakeType,
            introHeadline: existingContext.template.introHeadline,
            introBody: existingContext.template.introBody,
            customQuestions: existingContext.template.customQuestions
          })

          return { ok: true as const }
        }
      },
      payload
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to save settings." }, { status: 400 })
  }
}
