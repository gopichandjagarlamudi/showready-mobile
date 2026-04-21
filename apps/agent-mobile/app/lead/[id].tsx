import { useEffect, useMemo, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import type { Lead, LeadStage } from "@showready/contracts"
import { EmptyState } from "@/components/empty-state"
import { ScreenShell } from "@/components/screen-shell"
import { ActionButton } from "@/components/ui/action-button"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { FormField } from "@/components/ui/form-field"
import { InlineMessage } from "@/components/ui/inline-message"
import { StageChip } from "@/components/ui/stage-chip"
import { SurfaceCard } from "@/components/ui/surface-card"
import { mobileTheme } from "@/lib/theme"
import { useMobileApi, useSession } from "@/providers/session-provider"

const MOVE_STAGES: Array<
  Extract<
    LeadStage,
    "ready_to_show" | "nurture" | "hold" | "closed_won" | "closed_lost" | "archived"
  >
> = ["ready_to_show", "nurture", "hold", "closed_won", "closed_lost", "archived"]

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { workspaceVersion = 0 } = useSession()
  const api = useMobileApi()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading")
  const [message, setMessage] = useState<{
    tone: "success" | "error"
    title: string
    message: string
  } | null>(null)
  const [isStageSheetOpen, setIsStageSheetOpen] = useState(false)
  const [isOverrideSheetOpen, setIsOverrideSheetOpen] = useState(false)
  const [overrideScore, setOverrideScore] = useState("")
  const [overrideNote, setOverrideNote] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function load() {
      if (!id) {
        return
      }

      try {
        const result = await api.getLeadById(id)
        if (!isMounted) {
          return
        }
        setLead(result)
        setLoadState("ready")
      } catch (error) {
        if (!isMounted) {
          return
        }
        setMessage({
          tone: "error",
          title: "Unable to load lead",
          message: error instanceof Error ? error.message : "Try again."
        })
        setLoadState("error")
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [api, id, workspaceVersion])

  const answerSections = useMemo(() => {
    if (!lead?.answers) {
      return []
    }

    const sections: Array<{ title: string; rows: Array<[string, string]> }> = []
    const { contact, buyer, rental, customAnswers } = lead.answers

    sections.push({
      title: "Contact",
      rows: Object.entries(contact)
        .filter(([, value]) => Boolean(value))
        .map(([key, value]) => [labelize(key), formatAnswer(value)])
    })

    if (buyer && Object.keys(buyer).length > 0) {
      sections.push({
        title: "Buyer answers",
        rows: Object.entries(buyer)
          .filter(([, value]) => value !== undefined && value !== "")
          .map(([key, value]) => [labelize(key), formatAnswer(value)])
      })
    }

    if (rental && Object.keys(rental).length > 0) {
      sections.push({
        title: "Rental answers",
        rows: Object.entries(rental)
          .filter(([, value]) => value !== undefined && value !== "")
          .map(([key, value]) => [labelize(key), formatAnswer(value)])
      })
    }

    if (customAnswers && Object.keys(customAnswers).length > 0) {
      sections.push({
        title: "Custom answers",
        rows: Object.entries(customAnswers).map(([key, value]) => [labelize(key), formatAnswer(value)])
      })
    }

    return sections.filter((section) => section.rows.length > 0)
  }, [lead])

  async function moveLead(
    stage: Extract<
      LeadStage,
      "ready_to_show" | "nurture" | "hold" | "closed_won" | "closed_lost" | "archived"
    >
  ) {
    if (!lead) {
      return
    }

    setBusy(true)
    setMessage(null)

    try {
      const result = await api.moveLead(lead.id, stage)
      setLead(result.lead)
      setIsStageSheetOpen(false)
      setMessage({
        tone: "success",
        title: "Lead updated",
        message: `Moved ${result.lead.buyerName} to ${stage.replaceAll("_", " ")}.`
      })
    } catch (error) {
      setMessage({
        tone: "error",
        title: "Unable to update lead",
        message: error instanceof Error ? error.message : "Try again."
      })
    } finally {
      setBusy(false)
    }
  }

  async function saveOverride() {
    if (!lead) {
      return
    }

    const numericScore = Number(overrideScore)
    if (!Number.isFinite(numericScore) || !overrideNote.trim()) {
      setMessage({
        tone: "error",
        title: "Incomplete override",
        message: "Enter a numeric score and a note describing why you changed it."
      })
      return
    }

    setBusy(true)
    setMessage(null)

    try {
      const result = await api.overrideLeadScore(lead.id, {
        overrideScore: numericScore,
        note: overrideNote.trim()
      })
      setLead(result.lead)
      setOverrideScore("")
      setOverrideNote("")
      setIsOverrideSheetOpen(false)
      setMessage({
        tone: "success",
        title: "Override saved",
        message: "Manual score context is now attached to this lead."
      })
    } catch (error) {
      setMessage({
        tone: "error",
        title: "Unable to save override",
        message: error instanceof Error ? error.message : "Try again."
      })
    } finally {
      setBusy(false)
    }
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back()
      return
    }

    router.replace("/(app)/home")
  }

  return (
    <ScreenShell
      title={lead?.buyerName ?? "Lead detail"}
      subtitle="Review scoring context, move the lead through the pipeline, and preserve manual overrides with notes."
      testID="lead-detail-screen"
    >
      <ActionButton
        label="Back to leads"
        tone="secondary"
        onPress={handleBack}
        testID="lead-back-button"
      />

      {message ? (
        <InlineMessage tone={message.tone} title={message.title} message={message.message} />
      ) : null}

      {loadState === "loading" ? (
        <EmptyState title="Loading lead" body="Fetching the full submission and scoring detail." />
      ) : loadState === "error" || !lead ? (
        <EmptyState
          title="Lead unavailable"
          body="This submission may no longer be accessible in the signed-in workspace."
        />
      ) : (
        <>
          <SurfaceCard style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroMeta}>
                <Text style={styles.name}>{lead.buyerName}</Text>
                <Text style={styles.contact}>
                  {lead.buyerEmail ?? "No email"} {lead.buyerPhone ? `• ${lead.buyerPhone}` : ""}
                </Text>
                <Text style={styles.submitted}>
                  Submitted {lead.submittedAt ? formatDate(lead.submittedAt) : "recently"}
                </Text>
              </View>
              <StageChip stage={lead.pipelineStage} recommendation={lead.recommendation} />
            </View>
            <Text style={styles.score}>Score {lead.score?.toFixed(2) ?? "0.00"}</Text>
            <Text style={styles.summary}>{lead.summary ?? "Scoring summary pending."}</Text>
          </SurfaceCard>

          <SurfaceCard>
            <Text style={styles.sectionTitle}>Review context</Text>
            <Text style={styles.copy}>
              Suggested stage: {lead.review?.suggestedStage?.replaceAll("_", " ") ?? "Not available"}
            </Text>
            <Text style={styles.copy}>
              Reviewed stage: {lead.review?.reviewedStage?.replaceAll("_", " ") ?? "Not reviewed"}
            </Text>
            {lead.scoreOverride ? (
              <Text style={styles.copy}>
                Override: {lead.scoreOverride.overrideScore.toFixed(2)} with note "{lead.scoreOverride.note}"
              </Text>
            ) : null}
          </SurfaceCard>

          <SurfaceCard>
            <Text style={styles.sectionTitle}>Move lead</Text>
            <View style={styles.actionStack}>
              <ActionButton
                label="Change stage"
                icon="sliders"
                onPress={() => setIsStageSheetOpen(true)}
                disabled={busy}
                testID="lead-open-stage-sheet-button"
              />
              <Text style={styles.copy}>
                Current stage: {lead.pipelineStage.replaceAll("_", " ")}
              </Text>
            </View>
          </SurfaceCard>

          <SurfaceCard>
            <Text style={styles.sectionTitle}>Override score</Text>
            <View style={styles.actionStack}>
              <Text style={styles.copy}>
                Keep manual score changes deliberate and documented.
              </Text>
              <ActionButton
                label="Adjust score"
                tone="secondary"
                icon="edit-3"
                onPress={() => setIsOverrideSheetOpen(true)}
                disabled={busy}
                testID="lead-open-override-sheet-button"
              />
            </View>
          </SurfaceCard>

          {answerSections.map((section) => (
            <SurfaceCard key={section.title}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.rows.map(([label, value]) => (
                <View key={`${section.title}-${label}`} style={styles.answerRow}>
                  <Text style={styles.answerLabel}>{label}</Text>
                  <Text style={styles.answerValue}>{value}</Text>
                </View>
              ))}
            </SurfaceCard>
          ))}
        </>
      )}
      <BottomSheet
        visible={isStageSheetOpen}
        onClose={() => setIsStageSheetOpen(false)}
        title="Move lead"
        subtitle="Update the stage without expanding the main detail page."
        testID="lead-stage-sheet"
      >
        <View style={styles.actions}>
          {MOVE_STAGES.map((stage) => (
            <ActionButton
              key={stage}
              label={stage.replaceAll("_", " ")}
              tone={stage === lead?.pipelineStage ? "primary" : "secondary"}
              onPress={() => {
                void moveLead(stage)
              }}
              disabled={busy}
              testID={`lead-move-${stage}`}
            />
          ))}
        </View>
      </BottomSheet>
      <BottomSheet
        visible={isOverrideSheetOpen}
        onClose={() => setIsOverrideSheetOpen(false)}
        title="Override score"
        subtitle="Use only when the automated recommendation needs explicit agent context."
        testID="lead-override-sheet"
      >
        <FormField
          label="Override score"
          value={overrideScore}
          onChangeText={setOverrideScore}
          placeholder="9.0"
          keyboardType="decimal-pad"
          autoCapitalize="none"
          autoCorrect={false}
          testID="lead-override-score-input"
        />
        <FormField
          label="Override note"
          value={overrideNote}
          onChangeText={setOverrideNote}
          placeholder="Why this score should change"
          multiline
          testID="lead-override-note-input"
        />
        <ActionButton
          label={busy ? "Saving override..." : "Save override"}
          onPress={() => {
            void saveOverride()
          }}
          disabled={busy}
          testID="lead-save-override-button"
        />
      </BottomSheet>
    </ScreenShell>
  )
}

function labelize(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase())
}

function formatAnswer(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ")
  }

  return String(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value))
}

const styles = StyleSheet.create({
  heroCard: {
    gap: 12
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  heroMeta: {
    flex: 1,
    gap: 4
  },
  name: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  contact: {
    fontSize: 14,
    lineHeight: 21,
    color: mobileTheme.colors.mutedInk
  },
  submitted: {
    fontSize: 13,
    color: mobileTheme.colors.mutedInk
  },
  score: {
    fontSize: 22,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  summary: {
    fontSize: 14,
    lineHeight: 21,
    color: mobileTheme.colors.mutedInk
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  copy: {
    fontSize: 14,
    lineHeight: 21,
    color: mobileTheme.colors.mutedInk
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  actionStack: {
    gap: 10
  },
  answerRow: {
    gap: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.border
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: mobileTheme.colors.accent
  },
  answerValue: {
    fontSize: 14,
    lineHeight: 21,
    color: mobileTheme.colors.ink
  }
})
