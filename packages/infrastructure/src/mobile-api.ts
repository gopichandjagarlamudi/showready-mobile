import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  Appointment,
  DiagnosticsBatch,
  DiagnosticsBatchResponse,
  DashboardSummary,
  Lead
} from "@showready/contracts"
import { CreateInviteResponseSchema } from "@showready/contracts"
import { DiagnosticsBatchResponseSchema } from "@showready/contracts"
import { DashboardSummarySchema } from "@showready/contracts"
import { MobileApiError } from "./errors"

type MobileApiClientOptions = {
  supabase: SupabaseClient
  apiBaseUrl: string
  getAccessToken: () => Promise<string | null>
  fetcher?: typeof fetch
  onRequestError?: (input: {
    path: string
    method: string
    status: number
    message: string
  }) => Promise<void> | void
}

export function createMobileApiClient({
  supabase,
  apiBaseUrl,
  getAccessToken,
  fetcher = fetch,
  onRequestError
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

  async function handleApiFailure(path: string, method: string, status: number, message: string): Promise<never> {
    await onRequestError?.({
      path,
      method,
      status,
      message
    })

    throw new MobileApiError(status, message)
  }

  return {
    async getDashboardSummary(): Promise<DashboardSummary> {
      const path = "/api/mobile/dashboard"
      const response = await authorizedFetch(path)

      if (!response.ok) {
        return handleApiFailure(path, "GET", response.status, "Unable to load dashboard summary.")
      }

      return DashboardSummarySchema.parse(await response.json())
    },

    async createInvite() {
      const path = "/api/mobile/invites"
      const response = await authorizedFetch(path, {
        method: "POST"
      })

      if (!response.ok) {
        return handleApiFailure(path, "POST", response.status, "Unable to create invite.")
      }

      return CreateInviteResponseSchema.parse(await response.json())
    },

    async listNewLeads(agentId: string): Promise<Lead[]> {
      const path = `/api/mobile/leads?scope=new&agentId=${encodeURIComponent(agentId)}`
      const response = await authorizedFetch(path)

      if (!response.ok) {
        return handleApiFailure(path, "GET", response.status, "Unable to load new leads.")
      }

      const payload = (await response.json()) as { leads: Lead[] }
      return payload.leads
    },

    async listLeads(agentId: string): Promise<Lead[]> {
      const path = `/api/mobile/leads?agentId=${encodeURIComponent(agentId)}`
      const response = await authorizedFetch(path)

      if (!response.ok) {
        return handleApiFailure(path, "GET", response.status, "Unable to load leads.")
      }

      const payload = (await response.json()) as { leads: Lead[] }
      return payload.leads
    },

    async getLeadById(leadId: string): Promise<Lead | null> {
      const path = `/api/mobile/leads/${leadId}`
      const response = await authorizedFetch(path)

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        return handleApiFailure(path, "GET", response.status, "Unable to load lead.")
      }

      const payload = (await response.json()) as { lead: Lead }
      return payload.lead
    },

    async reviewLead(leadId: string, pipelineStage: "ready_to_show" | "nurture" | "hold") {
      const path = "/api/mobile/reviews"
      const response = await authorizedFetch(path, {
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
        return handleApiFailure(path, "POST", response.status, "Unable to review lead.")
      }

      return (await response.json()) as { lead: Lead }
    },

    async moveLead(
      leadId: string,
      pipelineStage: "ready_to_show" | "nurture" | "hold" | "closed_won" | "closed_lost" | "archived"
    ) {
      const path = `/api/mobile/leads/${leadId}/stage`
      const response = await authorizedFetch(path, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ pipelineStage })
      })

      if (!response.ok) {
        return handleApiFailure(path, "PATCH", response.status, "Unable to move lead.")
      }

      return (await response.json()) as { lead: Lead }
    },

    async listAppointments(status: "scheduled" | "completed" | "cancelled") {
      const path = `/api/mobile/appointments?status=${status}`
      const response = await authorizedFetch(path)

      if (!response.ok) {
        return handleApiFailure(path, "GET", response.status, "Unable to load appointments.")
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
      const path = "/api/mobile/appointments"
      const response = await authorizedFetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        return handleApiFailure(path, "POST", response.status, "Unable to save appointment.")
      }

      return (await response.json()) as { appointment: Appointment }
    },

    async updateAppointmentStatus(appointmentId: string, status: "scheduled" | "completed" | "cancelled") {
      const path = `/api/mobile/appointments/${appointmentId}/status`
      const response = await authorizedFetch(path, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        return handleApiFailure(path, "PATCH", response.status, "Unable to update appointment status.")
      }

      return (await response.json()) as { appointment: Appointment }
    },

    async saveSettings(input: {
      fullName: string
      brokerage?: string
      licenseNumber?: string
      emailNotificationsEnabled: boolean
    }) {
      const path = "/api/mobile/settings"
      const response = await authorizedFetch(path, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        return handleApiFailure(path, "PUT", response.status, "Unable to save settings.")
      }

      return (await response.json()) as { ok: true }
    },

    async getSettings() {
      const path = "/api/mobile/settings"
      const response = await authorizedFetch(path)

      if (!response.ok) {
        return handleApiFailure(path, "GET", response.status, "Unable to load settings.")
      }

      return (await response.json()) as {
        fullName: string
        brokerage?: string
        licenseNumber?: string
        emailNotificationsEnabled: boolean
        brandName: string
        brandColor: string
        accentColor: string
        showThreshold: number
      }
    },

    async registerPushToken(input: {
      expoPushToken: string
      platform: "ios" | "android" | "unknown"
    }) {
      const path = "/api/mobile/push-tokens"
      const response = await authorizedFetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        return handleApiFailure(path, "POST", response.status, "Unable to register push token.")
      }

      return (await response.json()) as { ok: true }
    },

    async overrideLeadScore(leadId: string, input: { overrideScore: number; note: string }) {
      const path = `/api/mobile/leads/${leadId}/override-score`
      const response = await authorizedFetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        return handleApiFailure(path, "POST", response.status, "Unable to override score.")
      }

      return (await response.json()) as { lead: Lead }
    },

    async submitDiagnostics(input: DiagnosticsBatch): Promise<DiagnosticsBatchResponse> {
      const path = "/api/mobile/diagnostics"
      const response = await authorizedFetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        return handleApiFailure(path, "POST", response.status, "Unable to submit diagnostics.")
      }

      return DiagnosticsBatchResponseSchema.parse(await response.json())
    }
  }
}
