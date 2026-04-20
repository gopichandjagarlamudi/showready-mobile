import { NextResponse } from "next/server"
import { AppointmentStatusSchema } from "@showready/contracts"
import { MobileAuthError, requireMobileAgent } from "@/lib/mobile-auth"
import { updateAppointmentStatus } from "@/lib/supabase/data"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params
    const { agentId, client } = await requireMobileAgent(request)
    const payload = AppointmentStatusSchema.parse({
      ...(await request.json()),
      appointmentId
    })
    const appointment = await updateAppointmentStatus(
      client,
      agentId,
      payload.appointmentId,
      payload.status
    )

    return NextResponse.json({ appointment })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to update appointment status." }, { status: 400 })
  }
}
