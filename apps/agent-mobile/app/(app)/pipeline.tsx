import { useEffect, useMemo, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { router } from "expo-router"
import type { Lead, LeadStage } from "@showready/contracts"
import { EmptyState } from "@/components/empty-state"
import { ScreenShell } from "@/components/screen-shell"
import { ActionButton } from "@/components/ui/action-button"
import { InlineMessage } from "@/components/ui/inline-message"
import { StageChip } from "@/components/ui/stage-chip"
import { SurfaceCard } from "@/components/ui/surface-card"
import { mobileTheme } from "@/lib/theme"
import { useMobileApi, useSession } from "@/providers/session-provider"

const ACTIVE_STAGES = ["ready_to_show", "appointment_booked", "nurture", "hold"]
const RESOLVED_STAGES = ["closed_won", "closed_lost", "archived"]
const MOVE_STAGES: Array<
  Extract<
    LeadStage,
    "ready_to_show" | "nurture" | "hold" | "closed_won" | "closed_lost" | "archived"
  >
> = ["ready_to_show", "nurture", "hold", "closed_won", "closed_lost", "archived"]

export default function PipelineScreen() {
  const { session } = useSession()
  const api = useMobileApi()
  const [leads, setLeads] = useState<Lead[]>([])
  const [tab, setTab] = useState<"active" | "resolved">("active")
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyLeadId, setBusyLeadId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    if (!session) {
      return
    }

    api
      .listLeads(session.user.id)
      .then((rows: Lead[]) => {
        if (!isMounted) {
          return
        }

        setLeads(rows)
        setLoadState("ready")
      })
      .catch((error: Error) => {
        if (!isMounted) {
          return
        }

        setLoadError(error.message)
        setLoadState("error")
      })

    return () => {
      isMounted = false
    }
  }, [api, session])

  const visibleLeads = useMemo(
    () =>
      leads.filter((lead) =>
        tab === "active"
          ? ACTIVE_STAGES.includes(lead.pipelineStage)
          : RESOLVED_STAGES.includes(lead.pipelineStage)
      ),
    [leads, tab]
  )

  async function moveLead(
    leadId: string,
    stage: Extract<
      LeadStage,
      "ready_to_show" | "nurture" | "hold" | "closed_won" | "closed_lost" | "archived"
    >
  ) {
    setBusyLeadId(leadId)
    setMessage(null)

    try {
      const result = await api.moveLead(leadId, stage)
      setLeads((current) =>
        current.map((lead) => (lead.id === leadId ? result.lead : lead))
      )
      setMessage(`Moved ${result.lead.buyerName} to ${stage.replaceAll("_", " ")}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to move lead.")
    } finally {
      setBusyLeadId(null)
    }
  }

  return (
    <ScreenShell
      title="Pipeline"
      subtitle="Move active leads deliberately and keep resolved outcomes distinct from the working queue."
      testID="pipeline-screen"
    >
      <View style={styles.toggleRow}>
        <ActionButton
          label="Active"
          tone={tab === "active" ? "primary" : "secondary"}
          onPress={() => setTab("active")}
          testID="pipeline-tab-active"
        />
        <ActionButton
          label="Resolved"
          tone={tab === "resolved" ? "primary" : "secondary"}
          onPress={() => setTab("resolved")}
          testID="pipeline-tab-resolved"
        />
      </View>

      {message ? (
        <InlineMessage tone="warning" title="Pipeline update" message={message} />
      ) : null}

      {loadState === "loading" ? (
        <EmptyState title="Loading pipeline" body="Pulling the latest lead movement from the workspace." />
      ) : loadState === "error" ? (
        <EmptyState title="Pipeline unavailable" body={loadError ?? "Try again."} />
      ) : visibleLeads.length === 0 ? (
        <EmptyState
          title="Nothing in this view"
          body="Active leads show here until they are closed or archived."
        />
      ) : (
        visibleLeads.map((lead) => (
          <SurfaceCard key={lead.id} style={styles.card} testID={`pipeline-card-${lead.id}`}>
            <View style={styles.header}>
              <View style={styles.headerMeta}>
                <Text style={styles.name}>{lead.buyerName}</Text>
                <Text style={styles.contact}>
                  {lead.buyerEmail ?? lead.buyerPhone ?? "Awaiting contact details"}
                </Text>
              </View>
              <StageChip stage={lead.pipelineStage} recommendation={lead.recommendation} />
            </View>
            <Text style={styles.summary}>{lead.summary ?? "Scoring summary pending."}</Text>
            <View style={styles.actions}>
              {MOVE_STAGES.map((stage) => (
                <ActionButton
                  key={stage}
                  label={stage.replaceAll("_", " ")}
                  tone={stage === lead.pipelineStage ? "primary" : "secondary"}
                  onPress={() => {
                    void moveLead(lead.id, stage)
                  }}
                  disabled={busyLeadId === lead.id}
                  testID={`pipeline-move-${lead.id}-${stage}`}
                />
              ))}
            </View>
            <ActionButton
              label="Open full detail"
              tone="secondary"
              onPress={() => router.push(`/lead/${lead.id}`)}
              testID={`pipeline-open-${lead.id}`}
            />
          </SurfaceCard>
        ))
      )}
    </ScreenShell>
  )
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    gap: 10
  },
  card: {
    gap: 14
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  headerMeta: {
    flex: 1,
    gap: 4
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  contact: {
    fontSize: 14,
    color: mobileTheme.colors.mutedInk
  },
  summary: {
    fontSize: 14,
    lineHeight: 21,
    color: mobileTheme.colors.mutedInk
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  }
})
