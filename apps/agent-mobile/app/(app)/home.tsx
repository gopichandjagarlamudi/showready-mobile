import { useEffect, useState } from "react"
import * as Clipboard from "expo-clipboard"
import { Share, StyleSheet, Text, View } from "react-native"
import { router } from "expo-router"
import type { DashboardSummary, Lead } from "@showready/contracts"
import { EmptyState } from "@/components/empty-state"
import { ScreenShell } from "@/components/screen-shell"
import { ActionButton } from "@/components/ui/action-button"
import { InlineMessage } from "@/components/ui/inline-message"
import { StageChip } from "@/components/ui/stage-chip"
import { SurfaceCard } from "@/components/ui/surface-card"
import { mobileTheme } from "@/lib/theme"
import { useMobileApi, useSession } from "@/providers/session-provider"

export default function HomeScreen() {
  const { session } = useSession()
  const api = useMobileApi()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading")
  const [message, setMessage] = useState<{
    tone: "success" | "error"
    title: string
    message: string
  } | null>(null)
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)
  const [latestInviteUrl, setLatestInviteUrl] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    if (!session) {
      return
    }

    Promise.all([api.getDashboardSummary(), api.listLeads(session.user.id)])
      .then(([dashboardSummary, leads]) => {
        if (!isMounted) {
          return
        }

        setSummary(dashboardSummary)
        setRecentLeads(leads.slice(0, 4))
        setLoadState("ready")
      })
      .catch((error: Error) => {
        if (isMounted) {
          setMessage({
            tone: "error",
            title: "Unable to load dashboard",
            message: error.message
          })
          setLoadState("error")
        }
      })

    return () => {
      isMounted = false
    }
  }, [api, session])

  async function handleCreateInvite() {
    setIsCreatingInvite(true)
    setMessage(null)

    try {
      const invite = await api.createInvite()
      setLatestInviteUrl(invite.shareUrl)
      setMessage({
        tone: "success",
        title: "Invite ready",
        message: "A fresh intake link is ready to copy or share."
      })
    } catch (error) {
      setMessage({
        tone: "error",
        title: "Unable to create invite",
        message: error instanceof Error ? error.message : "Try again."
      })
    } finally {
      setIsCreatingInvite(false)
    }
  }

  async function handleCopyInvite() {
    if (!latestInviteUrl) {
      return
    }

    try {
      await Clipboard.setStringAsync(latestInviteUrl)
      setMessage({
        tone: "success",
        title: "Invite copied",
        message: "The latest intake link is on your clipboard."
      })
    } catch (error) {
      setMessage({
        tone: "error",
        title: "Unable to copy invite",
        message: error instanceof Error ? error.message : "Try again."
      })
    }
  }

  async function handleShareInvite() {
    if (!latestInviteUrl) {
      return
    }

    try {
      await Share.share({
        message: latestInviteUrl,
        url: latestInviteUrl
      })
    } catch (error) {
      setMessage({
        tone: "error",
        title: "Unable to share invite",
        message: error instanceof Error ? error.message : "Try again."
      })
    }
  }

  return (
    <ScreenShell
      title="Dashboard"
      subtitle="Create intake links, watch pipeline health, and jump straight into the latest lead movement."
      testID="dashboard-screen"
    >
      {message ? (
        <InlineMessage
          tone={message.tone}
          title={message.title}
          message={message.message}
        />
      ) : null}

      {loadState === "loading" ? (
        <EmptyState
          title="Loading workspace"
          body="Fetching current lead counts, readiness signals, and recent activity."
        />
      ) : loadState === "error" || !summary ? (
        <EmptyState
          title="Dashboard unavailable"
          body="Refresh after the network settles or after signing back into the mobile workspace."
        />
      ) : (
        <>
          <SurfaceCard style={styles.snapshotCard}>
            <Text style={styles.sectionEyebrow}>Pipeline snapshot</Text>
            <View style={styles.metricGrid}>
              <MetricCard label="Total leads" value={summary.totalLeads} />
              <MetricCard label="Ready to show" value={summary.readyToShow} />
              <MetricCard label="Booked" value={summary.appointmentBooked} />
              <MetricCard label="Nurture" value={summary.nurture} />
              <MetricCard label="Hold" value={summary.hold} />
              <MetricCard label="Average score" value={summary.averageScore.toFixed(1)} />
            </View>
          </SurfaceCard>

          <SurfaceCard style={styles.inviteCard}>
            <Text style={styles.sectionTitle}>Invite flow</Text>
            <Text style={styles.copy}>
              Generate a fresh seven-day intake link and hand it off from your phone without opening the web workspace.
            </Text>
            <ActionButton
              label={isCreatingInvite ? "Creating invite..." : "Create invite"}
              onPress={() => {
                void handleCreateInvite()
              }}
              disabled={isCreatingInvite}
              testID="invite-button"
            />
            {latestInviteUrl ? (
              <View style={styles.generatedInvite}>
                <Text style={styles.generatedInviteLabel}>Latest link</Text>
                <Text selectable style={styles.generatedInviteUrl}>
                  {latestInviteUrl}
                </Text>
                <ActionButton
                  label="Copy link"
                  tone="secondary"
                  onPress={() => {
                    void handleCopyInvite()
                  }}
                  testID="copy-invite-button"
                />
                <ActionButton
                  label="Share link"
                  tone="secondary"
                  onPress={() => {
                    void handleShareInvite()
                  }}
                  testID="share-invite-button"
                />
              </View>
            ) : null}
          </SurfaceCard>

          <SurfaceCard style={styles.listCard}>
            <Text style={styles.sectionTitle}>Recent lead movement</Text>
            {recentLeads.length === 0 ? (
              <EmptyState
                title="No recent activity"
                body="New submissions and pipeline updates will appear here once invites are in circulation."
              />
            ) : (
              recentLeads.map((lead) => (
                <View key={lead.id} style={styles.leadRow}>
                  <View style={styles.leadRowHeader}>
                    <View style={styles.leadMeta}>
                      <Text style={styles.leadName}>{lead.buyerName}</Text>
                      <Text style={styles.leadContact}>
                        {lead.buyerEmail ?? lead.buyerPhone ?? "Awaiting contact details"}
                      </Text>
                    </View>
                    <StageChip stage={lead.pipelineStage} recommendation={lead.recommendation} />
                  </View>
                  <Text style={styles.copy}>{lead.summary ?? "Scoring summary pending."}</Text>
                  <ActionButton
                    label="Open lead"
                    tone="secondary"
                    onPress={() => router.push(`/lead/${lead.id}`)}
                    testID={`home-open-lead-${lead.id}`}
                  />
                </View>
              ))
            )}
          </SurfaceCard>
        </>
      )}
    </ScreenShell>
  )
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  snapshotCard: {
    gap: 14
  },
  inviteCard: {
    gap: 12
  },
  generatedInvite: {
    gap: 10,
    paddingTop: 4
  },
  generatedInviteLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: mobileTheme.colors.mutedInk
  },
  generatedInviteUrl: {
    fontSize: 14,
    lineHeight: 21,
    color: mobileTheme.colors.ink
  },
  listCard: {
    gap: 14
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: mobileTheme.colors.accent
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  copy: {
    fontSize: 14,
    lineHeight: 21,
    color: mobileTheme.colors.mutedInk
  },
  metricGrid: {
    gap: 10
  },
  metricCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surfaceStrong,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 6
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: mobileTheme.colors.mutedInk
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  leadRow: {
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.border
  },
  leadRowHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  leadMeta: {
    flex: 1,
    gap: 4
  },
  leadName: {
    fontSize: 18,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  leadContact: {
    fontSize: 14,
    color: mobileTheme.colors.mutedInk
  }
})
