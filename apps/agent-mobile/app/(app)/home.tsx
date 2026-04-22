import { useEffect, useState } from "react"
import * as Clipboard from "expo-clipboard"
import { Pressable, Share, StyleSheet, Text, View } from "react-native"
import { router } from "expo-router"
import type { DashboardSummary, Lead } from "@showready/contracts"
import { EmptyState } from "@/components/empty-state"
import { ScreenShell } from "@/components/screen-shell"
import { ActionButton } from "@/components/ui/action-button"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { InlineMessage } from "@/components/ui/inline-message"
import { StageChip } from "@/components/ui/stage-chip"
import { SurfaceCard } from "@/components/ui/surface-card"
import { mobileTheme } from "@/lib/theme"
import { useMobileApi, useSession } from "@/providers/session-provider"

export default function HomeScreen() {
  const { session, workspaceVersion = 0 } = useSession()
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
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false)

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
  }, [api, session, workspaceVersion])

  async function handleCreateInvite() {
    setIsCreatingInvite(true)
    setMessage(null)

    try {
      const invite = await api.createInvite()
      setLatestInviteUrl(invite.shareUrl)
      setIsInviteSheetOpen(true)
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
      title="Field dashboard"
      headerAction={{
        icon: "settings",
        label: "Open settings",
        onPress: () => router.push("/settings"),
        testID: "home-settings-button"
      }}
      testID="dashboard-screen"
    >
      {message ? (
        <InlineMessage tone={message.tone} title={message.title} message={message.message} />
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
          <SurfaceCard style={styles.heroCard}>
            <Text style={styles.sectionEyebrow}>Today at a glance</Text>
            <Text style={styles.heroValue}>{summary.totalLeads} live leads</Text>
            <Text style={styles.copy}>
              {summary.readyToShow} ready to show, {summary.appointmentBooked} booked, and an average
              qualification score of {summary.averageScore.toFixed(1)}.
            </Text>
            <View style={styles.actionRow}>
              <ActionButton
                label="Invite tools"
                icon="link"
                onPress={() => setIsInviteSheetOpen(true)}
                testID="invite-sheet-open-button"
              />
              <ActionButton
                label="Open queue"
                tone="secondary"
                icon="inbox"
                onPress={() => router.push("/new-leads")}
              />
            </View>
          </SurfaceCard>

          <View style={styles.metricGrid}>
            <MetricTile label="Ready" value={summary.readyToShow} tone="ready" />
            <MetricTile label="Booked" value={summary.appointmentBooked} tone="appointment" />
            <MetricTile label="Nurture" value={summary.nurture} tone="nurture" />
            <MetricTile label="Hold" value={summary.hold} tone="hold" />
          </View>

          <SurfaceCard style={styles.listCard}>
            <View style={styles.listHeader}>
              <View style={styles.listHeaderCopy}>
                <Text style={styles.sectionTitle}>Recent lead movement</Text>
                <Text style={styles.copy}>The four most recent submissions stay within thumb reach.</Text>
              </View>
            </View>

            {recentLeads.length === 0 ? (
              <EmptyState
                title="No recent activity"
                body="New submissions and pipeline updates will appear here once invites are in circulation."
                variant="guided"
                eyebrow="First run"
              />
            ) : (
              recentLeads.map((lead) => (
                <Pressable
                  key={lead.id}
                  accessibilityRole="button"
                  onPress={() => router.push(`/lead/${lead.id}`)}
                  style={({ pressed }) => [styles.leadRow, pressed ? styles.leadRowPressed : null]}
                  testID={`home-open-lead-${lead.id}`}
                >
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
                </Pressable>
              ))
            )}
          </SurfaceCard>
        </>
      )}
      <BottomSheet
        visible={isInviteSheetOpen}
        onClose={() => setIsInviteSheetOpen(false)}
        title="Invite tools"
        subtitle="Generate and hand off intake links without crowding the dashboard."
        testID="invite-sheet"
      >
        {latestInviteUrl ? (
          <>
            <View style={styles.generatedInvite}>
              <Text selectable style={styles.generatedInviteUrl}>
                {latestInviteUrl}
              </Text>
            </View>
            <View style={styles.actionRow}>
              <ActionButton
                label={isCreatingInvite ? "Creating invite..." : "Refresh invite"}
                icon="refresh-cw"
                onPress={() => {
                  void handleCreateInvite()
                }}
                disabled={isCreatingInvite}
                testID="invite-button"
              />
              <ActionButton
                label="Copy link"
                icon="copy"
                tone="secondary"
                onPress={() => {
                  void handleCopyInvite()
                }}
                testID="copy-invite-button"
              />
              <ActionButton
                label="Share link"
                icon="share"
                tone="secondary"
                onPress={() => {
                  void handleShareInvite()
                }}
                testID="share-invite-button"
              />
            </View>
          </>
        ) : (
          <EmptyState
            title="No link yet"
            body="Create an intake link here, then copy or share it without leaving the dashboard."
            actionLabel={isCreatingInvite ? "Creating invite..." : "Create invite"}
            onAction={() => {
              void handleCreateInvite()
            }}
            variant="guided"
            eyebrow="Primary action"
          />
        )}
      </BottomSheet>
    </ScreenShell>
  )
}

function MetricTile({
  label,
  value,
  tone
}: {
  label: string
  value: number | string
  tone: "ready" | "appointment" | "nurture" | "hold"
}) {
  const palette =
    tone === "ready"
      ? { backgroundColor: mobileTheme.colors.readySoft, color: mobileTheme.colors.ready }
      : tone === "appointment"
        ? {
            backgroundColor: mobileTheme.colors.appointmentSoft,
            color: mobileTheme.colors.appointment
          }
        : tone === "nurture"
          ? { backgroundColor: mobileTheme.colors.nurtureSoft, color: mobileTheme.colors.nurture }
          : { backgroundColor: mobileTheme.colors.holdSoft, color: mobileTheme.colors.hold }

  return (
    <View style={[styles.metricTile, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.metricLabel, { color: palette.color }]}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  heroCard: {
    gap: 12
  },
  heroValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  generatedInvite: {
    borderRadius: mobileTheme.radii.control,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    padding: 14
  },
  generatedInviteUrl: {
    fontSize: 14,
    lineHeight: 22,
    color: mobileTheme.colors.ink
  },
  listCard: {
    gap: 14
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: mobileTheme.colors.brandStrong
  },
  sectionTitle: {
    fontSize: mobileTheme.typography.section,
    lineHeight: 28,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  copy: {
    fontSize: 14,
    lineHeight: 21,
    color: mobileTheme.colors.mutedInk
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  metricTile: {
    width: "47%",
    minHeight: 108,
    borderRadius: mobileTheme.radii.card,
    paddingHorizontal: 16,
    paddingVertical: 18,
    justifyContent: "space-between"
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  metricValue: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  listHeader: {
    gap: 12
  },
  listHeaderCopy: {
    gap: 4
  },
  leadRow: {
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.border
  },
  leadRowPressed: {
    opacity: 0.86
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
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  leadContact: {
    fontSize: 14,
    lineHeight: 20,
    color: mobileTheme.colors.mutedInk
  }
})
