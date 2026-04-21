import { useEffect, useMemo, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { router } from "expo-router"
import type { Lead, LeadStage } from "@showready/contracts"
import { EmptyState } from "@/components/empty-state"
import { ScreenShell } from "@/components/screen-shell"
import { ActionButton } from "@/components/ui/action-button"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { InlineMessage } from "@/components/ui/inline-message"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { StageChip } from "@/components/ui/stage-chip"
import { SurfaceCard } from "@/components/ui/surface-card"
import { mobileTheme } from "@/lib/theme"
import { useMobileApi, useSession } from "@/providers/session-provider"

const ACTIVE_SECTIONS = [
  { stage: "ready_to_show", label: "Ready to Show" },
  { stage: "nurture", label: "Nurture" },
  { stage: "hold", label: "Hold" }
] as const
const RESOLVED_SECTIONS = [
  { stage: "closed_won", label: "Closed Won" },
  { stage: "closed_lost", label: "Closed Lost" },
  { stage: "archived", label: "Archived" }
] as const
const MOVE_STAGES: Array<
  Extract<
    LeadStage,
    "ready_to_show" | "nurture" | "hold" | "closed_won" | "closed_lost" | "archived"
  >
> = ["ready_to_show", "nurture", "hold", "closed_won", "closed_lost", "archived"]
type PipelineCategoryStage = (typeof ACTIVE_SECTIONS)[number]["stage"] | (typeof RESOLVED_SECTIONS)[number]["stage"]
type PipelineSection = {
  stage: PipelineCategoryStage
  label: string
  leads: Lead[]
}

function getPipelineDisplayStage(lead: Lead): PipelineCategoryStage | null {
  if (
    lead.pipelineStage === "ready_to_show" ||
    lead.pipelineStage === "nurture" ||
    lead.pipelineStage === "hold" ||
    lead.pipelineStage === "closed_won" ||
    lead.pipelineStage === "closed_lost" ||
    lead.pipelineStage === "archived"
  ) {
    return lead.pipelineStage
  }

  if (lead.pipelineStage !== "appointment_booked") {
    return null
  }

  if (
    lead.review?.reviewedStage === "ready_to_show" ||
    lead.review?.reviewedStage === "nurture" ||
    lead.review?.reviewedStage === "hold"
  ) {
    return lead.review.reviewedStage
  }

  if (
    lead.review?.suggestedStage === "ready_to_show" ||
    lead.review?.suggestedStage === "nurture" ||
    lead.review?.suggestedStage === "hold"
  ) {
    return lead.review.suggestedStage
  }

  if (lead.recommendation === "show") {
    return "ready_to_show"
  }

  if (lead.recommendation === "nurture") {
    return "nurture"
  }

  return "hold"
}

export default function PipelineScreen() {
  const { session, workspaceVersion = 0 } = useSession()
  const api = useMobileApi()
  const [leads, setLeads] = useState<Lead[]>([])
  const [tab, setTab] = useState<"active" | "resolved">("active")
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyLeadId, setBusyLeadId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

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
  }, [api, session, workspaceVersion])

  const sections = useMemo<PipelineSection[]>(
    () =>
      (tab === "active" ? ACTIVE_SECTIONS : RESOLVED_SECTIONS).map((section) => ({
        ...section,
        leads: leads.filter((lead) => getPipelineDisplayStage(lead) === section.stage)
      })),
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
      subtitle="Review active versus resolved deals without forcing too many choices into the same mobile layer."
      testID="pipeline-screen"
    >
      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { label: "Active", value: "active" },
          { label: "Resolved", value: "resolved" }
        ]}
        testIDPrefix="pipeline-tab"
      />

      {message ? (
        <InlineMessage tone="warning" title="Pipeline update" message={message} />
      ) : null}

      {loadState === "loading" ? (
        <EmptyState title="Loading pipeline" body="Pulling the latest lead movement from the workspace." />
      ) : loadState === "error" ? (
        <EmptyState title="Pipeline unavailable" body={loadError ?? "Try again."} />
      ) : (
        sections.map((section) => (
          <View key={section.stage} style={styles.section} testID={`pipeline-section-${section.stage}`}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.label}</Text>
              <Text style={styles.sectionCount}>{section.leads.length}</Text>
            </View>

            {section.leads.length === 0 ? (
              <Text style={styles.sectionEmpty}>No leads in this category yet.</Text>
            ) : (
              section.leads.map((lead) => {
                const displayStage = getPipelineDisplayStage(lead) ?? lead.pipelineStage

                return (
                  <SurfaceCard key={lead.id} style={styles.card} testID={`pipeline-card-${lead.id}`}>
                    <View style={styles.header}>
                      <View style={styles.headerMeta}>
                        <Text style={styles.name}>{lead.buyerName}</Text>
                        <Text style={styles.contact}>
                          {lead.buyerEmail ?? lead.buyerPhone ?? "Awaiting contact details"}
                        </Text>
                      </View>
                      <StageChip stage={displayStage} recommendation={lead.recommendation} />
                    </View>
                    <Text style={styles.summary}>{lead.summary ?? "Scoring summary pending."}</Text>
                    <View style={styles.primaryActions}>
                      <ActionButton
                        label="Update stage"
                        icon="sliders"
                        onPress={() => setSelectedLead(lead)}
                        disabled={busyLeadId === lead.id}
                        testID={`pipeline-open-stage-sheet-${lead.id}`}
                      />
                      <ActionButton
                        label="Open full detail"
                        tone="secondary"
                        onPress={() => router.push(`/lead/${lead.id}`)}
                        testID={`pipeline-open-${lead.id}`}
                      />
                    </View>
                  </SurfaceCard>
                )
              })
            )}
          </View>
        ))
      )}
      <BottomSheet
        visible={selectedLead !== null}
        onClose={() => setSelectedLead(null)}
        title={selectedLead ? `Move ${selectedLead.buyerName}` : "Move lead"}
        subtitle="Keep stage changes contextual instead of crowding every card."
        testID="pipeline-stage-sheet"
      >
        {selectedLead ? (
          <>
            <InlineMessage
              tone="warning"
              title="Current stage"
              message={(getPipelineDisplayStage(selectedLead) ?? selectedLead.pipelineStage).replaceAll("_", " ")}
            />
            <View style={styles.sheetActions}>
              {MOVE_STAGES.map((stage) => {
                const currentStage = getPipelineDisplayStage(selectedLead) ?? selectedLead.pipelineStage

                return (
                  <ActionButton
                    key={stage}
                    label={stage.replaceAll("_", " ")}
                    tone={stage === currentStage ? "primary" : "secondary"}
                    onPress={() => {
                      void moveLead(selectedLead.id, stage)
                      setSelectedLead(null)
                    }}
                    disabled={busyLeadId === selectedLead.id}
                    testID={`pipeline-move-${selectedLead.id}-${stage}`}
                  />
                )
              })}
            </View>
          </>
        ) : null}
      </BottomSheet>
    </ScreenShell>
  )
}

const styles = StyleSheet.create({
  section: {
    gap: 12
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  sectionCount: {
    minWidth: 28,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    textAlign: "center",
    overflow: "hidden",
    backgroundColor: mobileTheme.colors.surfaceMuted,
    color: mobileTheme.colors.mutedInk,
    fontSize: 13,
    fontWeight: "700"
  },
  sectionEmpty: {
    fontSize: 14,
    lineHeight: 21,
    color: mobileTheme.colors.mutedInk
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
  primaryActions: {
    gap: 10
  },
  sheetActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  }
})
