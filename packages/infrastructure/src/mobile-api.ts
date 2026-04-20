import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  Appointment,
  DashboardSummary,
  Lead
} from "@showready/contracts"
import { CreateInviteResponseSchema } from "@showready/contracts"
import { DashboardSummarySchema } from "@showready/contracts"
import { MobileApiError } from "./errors"

type MobileApiClientOptions = {
  supabase: SupabaseClient
  apiBaseUrl: string
  getAccessToken: () => Promise<string | null>
  fetcher?: typeof fetch
}

export function createMobileApiClient({
  supabase,
  apiBaseUrl,
  getAccessToken,
  fetcher = fetch
}: MobileApiClientOptions) {
  async function authorizedFetch(path: string, init: RequestInit = {}) {
    const token = await getAccessToken()
    const headers = new Headers(init.headers)

    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }

    return fetcher(`${apiBaseUrl}${path}`, {
      ...init,
      headers
    })
  }

  return {
    async getDashboardSummary(): Promise<DashboardSummary> {
      const response = await authorizedFetch("/api/mobile/dashboard")

      if (!response.ok) {
        throw new MobileApiError(response.status, "Unable to load dashboard summary.")
      }

      return DashboardSummarySchema.parse(await response.json())
    },

    async createInvite() {
      const response = await authorizedFetch("/api/mobile/invites", {
        method: "POST"
      })

      if (!response.ok) {
        throw new MobileApiError(response.status, "Unable to create invite.")
      }

      return CreateInviteResponseSchema.parse(await response.json())
    },

    async listNewLeads(agentId: string): Promise<Lead[]> {
      const response = await authorizedFetch(
        `/api/mobile/leads?scope=new&agentId=${encodeURIComponent(agentId)}`
      )

      if (!response.ok) {
        throw new MobileApiError(response.status, "Unable to load new leads.")
      }

      const payload = (await response.json()) as { leads: Lead[] }
      return payload.leads
    },

    async listLeads(agentId: string): Promise<Lead[]> {
      const response = await authorizedFetch(`/api/mobile/leads?agentId=${encodeURIComponent(agentId)}`)

      if (!response.ok) {
        throw new MobileApiError(response.status, "Unable to load leads.")
      }

      const payload = (await response.json()) as { leads: Lead[] }
      return payload.leads
    },

    async getLeadById(leadId: string): Promise<Lead | null> {
      const response = await authorizedFetch(`/api/mobile/leads/${leadId}`)

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new MobileApiError(response.status, "Unable to load lead.")
      }

      const payload = (await response.json()) as { lead: Lead }
      return payload.lead
    },

    async reviewLead(leadId: string, pipelineStage: "ready_to_show" | "nurture" | "hold") {
      const response = await authorizedFetch("/api/mobile/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          leadId,
          pipelineStage
        })
      })

      if (!response.ok) {
        throw new MobileApiError(response.status, "Unable to review lead.")
      }

      return (await response.json()) as { lead: Lead }
    },

    async moveLead(
      leadId: string,
      pipelineStage: "ready_to_show" | "nurture" | "hold" | "closed_won" | "closed_lost" | "archived"
    ) {
      const response = await authorizedFetch(`/api/mobile/leads/${leadId}/stage`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ pipelineStage })
      })

      if (!response.ok) {
        throw new MobileApiError(response.status, "Unable to move lead.")
      }

      return (await response.json()) as { lead: Lead }
    },

    async listAppointments(status: "scheduled" | "completed" | "cancelled") {
      const response = await authorizedFetch(`/api/mobile/appointments?status=${status}`)

      if (!response.ok) {
        throw new MobileApiError(response.status, "Unable to load appointments.")
      }

      const payload = (await response.json()) as { appointments: Appointment[] }
      return payload.appointments
    },

    async saveAppointment(input: {
      appointmentId?: string
      leadId: string
      date: string
      startTime: string
      notes?: string
      showings: {
        address: string
        notes?: string
      }[]
    }) {
      const response = await authorizedFetch("/api/mobile/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        throw new MobileApiError(response.status, "Unable to save appointment.")
      }

      return (await response.json()) as { appointment: Appointment }
    },

    async updateAppointmentStatus(appointmentId: string, status: "scheduled" | "completed" | "cancelled") {
      const response = await authorizedFetch(`/api/mobile/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new MobileApiError(response.status, "Unable to update appointment status.")
      }

      return (await response.json()) as { appointment: Appointment }
    },

    async saveSettings(input: {
      fullName: string
      brokerage?: string
      licenseNumber?: string
      notificationPreference: "email" | "email_and_push"
    }) {
      const response = await authorizedFetch("/api/mobile/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        throw new MobileApiError(response.status, "Unable to save settings.")
      }

      return (await response.json()) as { ok: true }
    },

    async getSettings() {
      const response = await authorizedFetch("/api/mobile/settings")

      if (!response.ok) {
        throw new MobileApiError(response.status, "Unable to load settings.")
      }

      return (await response.json()) as {
        fullName: string
        brokerage?: string
        licenseNumber?: string
        notificationPreference: "email" | "email_and_push"
        brandName: string
        brandColor: string
        accentColor: string
        showThreshold: number
      }
    },

    async overrideLeadScore(leadId: string, input: { overrideScore: number; note: string }) {
      const response = await authorizedFetch(`/api/mobile/leads/${leadId}/override-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        throw new MobileApiError(response.status, "Unable to override score.")
      }

      return (await response.json()) as { lead: Lead }
    }
  }
}
