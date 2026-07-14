import { describe, expect, it, vi } from "vitest"
import { createAdminDashboardGateway } from "../src/admin-dashboard"

it("uses the overview RPC and parses the strict response", async () => {
  const rpc = vi.fn(async () => ({
    data: {
      rangeDays: 30,
      metrics: Array.from({ length: 8 }, () => ({ label: "Metric", value: 0, helpText: "Help" })),
      dailyEventVolume: [],
      errorGroups: []
    },
    error: null
  }))
  const gateway = createAdminDashboardGateway({ rpc } as never)

  await gateway.getOverview(30)

  expect(rpc).toHaveBeenCalledWith("get_admin_dashboard_overview", { p_range_days: 30 })
})

it("rejects a detail RPC response with forbidden client data", async () => {
  const rpc = vi.fn(async () => ({
    data: {
      profile: { id: "00000000-0000-4000-8000-000000000001", fullName: "Morgan", email: "morgan@example.com", brokerage: null, joinedAt: null, lastTrackedActivityAt: null },
      aggregates: { leadCount: 0, submittedIntakeCount: 0, appointmentCount: 0 },
      recentEvents: [], feedback: [], diagnostics: [], serverErrors: [], buyerEmail: "client@example.com"
    },
    error: null
  }))
  const gateway = createAdminDashboardGateway({ rpc } as never)

  await expect(gateway.getAgentDetail("00000000-0000-4000-8000-000000000001", 30)).rejects.toThrow()
})
