import { useEffect, useState } from "react"
import { FlatList, StyleSheet, Text, View } from "react-native"
import { router } from "expo-router"
import type { Lead } from "@showready/contracts"
import { EmptyState } from "@/components/empty-state"
import { ScreenShell } from "@/components/screen-shell"
import { ActionButton } from "@/components/ui/action-button"
import { InlineMessage } from "@/components/ui/inline-message"
import { StageChip } from "@/components/ui/stage-chip"
import { SurfaceCard } from "@/components/ui/surface-card"
import { mobileTheme } from "@/lib/theme"
import { useMobileApi, useSession } from "@/providers/session-provider"

type ReviewStage = "ready_to_show" | "nurture" | "hold"

function suggestedReviewStage(lead: Lead): ReviewStage {
  return lead.recommendation === "show"
    ? "ready_to_show"
    : lead.recommendation === "nurture"
      ? "nurture"
      : "hold"
}

export default function NewLeadsScreen() {
  const { session, workspaceVersion = 0, refreshWorkspace } = useSession()
  const api = useMobileApi()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading")
  const [nextOffset, setNextOffset] = useState<number | undefined>()
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyLeadIds, setBusyLeadIds] = useState<Record<string, boolean>>({})
  const [messages, setMessages] = useState<Record<string, string | null>>({})

  useEffect(() => {
    let isMounted = true

    if (!session) {
      return
    }

    api
      .listNewLeads({ limit: 25, offset: 0 })
      .then((page) => {
        if (!isMounted) {
          return
        }

        setLeads(page.leads)
        setNextOffset(page.nextOffset)
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

  async function handleLoadMore() {
    if (nextOffset === undefined || isLoadingMore) {
      return
    }

    setIsLoadingMore(true)

    try {
      const page = await api.listNewLeads({ limit: 25, offset: nextOffset })
      setLeads((current) => {
        const seen = new Set(current.map((lead) => lead.id))
        return current.concat(page.leads.filter((lead) => !seen.has(lead.id)))
      })
      setNextOffset(page.nextOffset)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load more leads.")
    } finally {
      setIsLoadingMore(false)
    }
  }

  async function handleReview(leadId: string, stage: ReviewStage) {
    setMessages((current) => ({ ...current, [leadId]: null }))
    setBusyLeadIds((current) => ({ ...current, [leadId]: true }))

    try {
      await api.reviewLead(leadId, stage)
      setLeads((current) => current.filter((lead) => lead.id !== leadId))
      refreshWorkspace()
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [leadId]: error instanceof Error ? error.message : "Unable to review lead."
      }))
    } finally {
      setBusyLeadIds((current) => {
        const next = { ...current }
        delete next[leadId]
        return next
      })
    }
  }

  return (
    <ScreenShell
      title="New leads"
      testID="new-leads-screen"
      scrollable={false}
      contentStyle={styles.shellContent}
    >
      {loadState === "loading" ? (
        <EmptyState
          title="Loading queue"
          body="Checking for newly submitted leads that still need agent review."
        />
      ) : loadState === "error" ? (
        <EmptyState title="Queue unavailable" body={loadError ?? "Try again in a moment."} />
      ) : leads.length === 0 ? (
        <EmptyState
          title="Review queue clear"
          body="New invite submissions will land here before they move into the active pipeline."
          variant="guided"
          eyebrow="Queue"
          icon="inbox"
        />
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(lead) => lead.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: lead }) => (
            <ReviewLeadCard
              lead={lead}
              isBusy={Boolean(busyLeadIds[lead.id])}
              message={messages[lead.id] ?? null}
              onReview={handleReview}
            />
          )}
          ListFooterComponent={
            nextOffset !== undefined ? (
              <ActionButton
                label={isLoadingMore ? "Loading..." : "Load more"}
                tone="secondary"
                disabled={isLoadingMore}
                onPress={() => {
                  void handleLoadMore()
                }}
                testID="new-leads-load-more"
              />
            ) : null
          }
        />
      )}
    </ScreenShell>
  )
}

function ReviewLeadCard({
  lead,
  isBusy,
  message,
  onReview
}: {
  lead: Lead
  isBusy: boolean
  message: string | null
  onReview: (leadId: string, stage: ReviewStage) => Promise<void>
}) {
  const suggestedStage = suggestedReviewStage(lead)

  return (
    <SurfaceCard style={styles.card} testID={`new-lead-card-${lead.id}`}>
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
      <Text style={styles.hint}>Suggested path: {suggestedStage.replaceAll("_", " ")}</Text>
      {message ? (
        <InlineMessage
          tone="error"
          title="Unable to review lead"
          message={message}
        />
      ) : null}
      <View style={styles.actions}>
        <ActionButton
          label={isBusy ? "Applying suggestion..." : "Confirm suggestion"}
          onPress={() => {
            void onReview(lead.id, suggestedStage)
          }}
          disabled={isBusy}
          testID={`review-confirm-${lead.id}`}
        />
        <View style={styles.secondaryActions}>
          <ActionButton
            label="Ready"
            tone="secondary"
            onPress={() => {
              void onReview(lead.id, "ready_to_show")
            }}
            disabled={isBusy}
            testID={`review-ready-${lead.id}`}
          />
          <ActionButton
            label="Nurture"
            tone="secondary"
            onPress={() => {
              void onReview(lead.id, "nurture")
            }}
            disabled={isBusy}
            testID={`review-nurture-${lead.id}`}
          />
          <ActionButton
            label="Hold"
            tone="secondary"
            onPress={() => {
              void onReview(lead.id, "hold")
            }}
            disabled={isBusy}
            testID={`review-hold-${lead.id}`}
          />
        </View>
        <ActionButton
          label="Open full detail"
          tone="secondary"
          onPress={() => router.push(`/lead/${lead.id}`)}
          testID={`review-open-${lead.id}`}
        />
      </View>
    </SurfaceCard>
  )
}

const styles = StyleSheet.create({
  shellContent: {
    flexGrow: 1
  },
  listContent: {
    gap: 16,
    paddingBottom: 24
  },
  card: {
    gap: 16
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
    lineHeight: 25,
    fontWeight: "800",
    color: mobileTheme.colors.ink
  },
  contact: {
    fontSize: 13,
    lineHeight: 18,
    color: mobileTheme.colors.mutedInk
  },
  summary: {
    fontSize: mobileTheme.typography.body,
    lineHeight: 22,
    color: mobileTheme.colors.mutedInk
  },
  hint: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0,
    color: mobileTheme.colors.accent
  },
  actions: {
    gap: 10
  },
  secondaryActions: {
    gap: 10
  }
})
