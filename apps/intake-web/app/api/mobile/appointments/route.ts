import { NextResponse } from "next/server"
import { saveAppointment } from "@showready/application"
import { AppointmentMutationSchema } from "@showready/contracts"
import { MobileAuthError, requireMobileAgent } from "@/lib/mobile-auth"
import { createAppointment, listAppointments, updateAppointment } from "@/lib/supabase/data"

export async function GET(request: Request) {
  try {
    const { agentId, client } = await requireMobileAgent(request)
    const { searchParams } = new URL(request.url)
    const status =
      searchParams.get("status") === "completed" || searchParams.get("status") === "cancelled"
        ? (searchParams.get("status") as "completed" | "cancelled")
        : "scheduled"
    const appointments = await listAppointments(client, agentId, status)

    return NextResponse.json({ appointments })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to load appointments." }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const { agentId, client } = await requireMobileAgent(request)
    const payload = AppointmentMutationSchema.parse(await request.json())
    const appointment = await saveAppointment(
      {
        saveAppointment: (input) =>
          payload.appointmentId
            ? updateAppointment(client, agentId, payload.appointmentId as string, input)
            : createAppointment(client, agentId, input)
      },
      payload
    )

    return NextResponse.json(
      { appointment },
      { status: payload.appointmentId ? 200 : 201 }
    )
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to save appointment." }, { status: 400 })
  }
}
