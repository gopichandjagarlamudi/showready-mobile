import { useEffect, useRef, useState } from "react"
import * as Clipboard from "expo-clipboard"
import { Feather } from "@expo/vector-icons"
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native"
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
  const [hasCopiedInvite, setHasCopiedInvite] = useState(false)
  const copyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    return () => {
      clearCopyFeedbackTimer()
    }
  }, [])

  function clearCopyFeedbackTimer() {
    if (copyFeedbackTimerRef.current) {
      clearTimeout(copyFeedbackTimerRef.current)
      copyFeedbackTimerRef.current = null
    }
  }

  function resetCopyFeedback() {
    clearCopyFeedbackTimer()
    setHasCopiedInvite(false)
  }

  function showCopyFeedback() {
    clearCopyFeedbackTimer()
    setHasCopiedInvite(true)
    copyFeedbackTimerRef.current = setTimeout(() => {
      setHasCopiedInvite(false)
      copyFeedbackTimerRef.current = null
    }, 2000)
  }

  function closeInviteSheet() {
    resetCopyFeedback()
    setIsInviteSheetOpen(false)
  }

  async function handleCreateInvite() {
    resetCopyFeedback()
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
      showCopyFeedback()
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
            <View style={styles.heroCardHeader}>
              <View style={styles.heroCardCopy}>
                <Text style={styles.sectionEyebrow}>Today at a glance</Text>
                <Text style={styles.heroValue}>{summary.totalLeads} active leads</Text>
                <Text style={styles.copy}>
                  {summary.readyToShow} ready to show, {summary.appointmentBooked} booked, and an average
                  qualification score of {summary.averageScore.toFixed(1)}.
                </Text>
              </View>
              <View style={styles.heroIconBadge}>
                <Feather name="users" size={34} color={mobileTheme.colors.brandStrong} />
              </View>
            </View>
            <View style={styles.heroDivider} />
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

          <ScrollView
            horizontal
            testID="home-metric-rail"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.metricRailContent}
          >
            <MetricTile
              label="Ready"
              value={summary.readyToShow}
              tone="ready"
              icon="check-circle"
              testID="home-metric-ready"
              onPress={() => router.push("/pipeline")}
            />
            <MetricTile
              label="Booked"
              value={summary.appointmentBooked}
              tone="appointment"
              icon="calendar"
              testID="home-metric-booked"
              onPress={() => router.push("/appointments")}
            />
            <MetricTile
              label="Nurture"
              value={summary.nurture}
              tone="nurture"
              icon="feather"
              testID="home-metric-nurture"
              onPress={() => router.push("/pipeline")}
            />
            <MetricTile
              label="Hold"
              value={summary.hold}
              tone="hold"
              icon="clock"
              testID="home-metric-hold"
              onPress={() => router.push("/pipeline")}
            />
          </ScrollView>

          <SurfaceCard style={styles.listCard}>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Recent lead movement</Text>
            </View>

            {recentLeads.length === 0 ? (
              <View style={styles.inlineEmptyState} testID="home-recent-empty">
                <View style={styles.inlineEmptyIcon}>
                  <Feather name="inbox" size={20} color={mobileTheme.colors.brandStrong} />
                </View>
                <View style={styles.inlineEmptyCopy}>
                  <Text style={styles.inlineEmptyTitle}>No recent activity</Text>
                  <Text style={styles.inlineEmptyBody}>
                    New submissions and pipeline updates will appear here once invites are in circulation.
                  </Text>
                </View>
              </View>
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
                    <View style={styles.leadAvatar}>
                      <Text style={styles.leadAvatarText}>{lead.buyerName.slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <View style={styles.leadMeta}>
                      <Text style={styles.leadName}>{lead.buyerName}</Text>
                      <Text style={styles.leadContact}>
                        {lead.buyerEmail ?? lead.buyerPhone ?? "Awaiting contact details"}
                      </Text>
                    </View>
                    <StageChip stage={lead.pipelineStage} recommendation={lead.recommendation} />
                  </View>
                </Pressable>
              ))
            )}
          </SurfaceCard>
        </>
      )}
      <BottomSheet
        visible={isInviteSheetOpen}
        onClose={closeInviteSheet}
        title="Invite tools"
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
                label={hasCopiedInvite ? "Copied to clipboard" : "Copy link"}
                icon={hasCopiedInvite ? "check" : "copy"}
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
          <View style={styles.inviteQuickStart}>
            <ActionButton
              label={isCreatingInvite ? "Creating invite..." : "Create invite"}
              icon="link"
              onPress={() => {
                void handleCreateInvite()
              }}
              disabled={isCreatingInvite}
              testID="invite-button"
            />
          </View>
        )}
      </BottomSheet>
    </ScreenShell>
  )
}

function MetricTile({
  label,
  value,
  tone,
  icon,
  onPress,
  testID
}: {
  label: string
  value: number | string
  tone: "ready" | "appointment" | "nurture" | "hold"
  icon: keyof typeof Feather.glyphMap
  onPress: () => void
  testID: string
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${label.toLowerCase()} leads`}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.metricTile,
        { backgroundColor: palette.backgroundColor, borderColor: palette.color },
        pressed ? styles.metricTilePressed : null
      ]}
    >
      <View style={[styles.metricIcon, { backgroundColor: mobileTheme.colors.surface }]}>
        <Feather name={icon} size={28} color={palette.color} />
      </View>
      <View style={styles.metricCopy}>
        <Text style={[styles.metricLabel, { color: palette.color }]}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
      <Feather name="chevron-right" size={24} color={mobileTheme.colors.ink} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  heroCard: {
    gap: 18
  },
  heroCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18
  },
  heroCardCopy: {
    flex: 1,
    gap: 12
  },
  heroIconBadge: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.surfaceStrong
  },
  heroDivider: {
    height: 1,
    backgroundColor: mobileTheme.colors.border
  },
  heroValue: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
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
  inviteQuickStart: {
    gap: 12
  },
  listCard: {
    gap: 14
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0,
    color: mobileTheme.colors.brandStrong
  },
  sectionTitle: {
    fontSize: mobileTheme.typography.section,
    lineHeight: 25,
    fontWeight: "800",
    color: mobileTheme.colors.ink
  },
  copy: {
    fontSize: mobileTheme.typography.body,
    lineHeight: 22,
    color: mobileTheme.colors.mutedInk
  },
  metricRailContent: {
    flexDirection: "row",
    gap: 12
  },
  metricTile: {
    width: 152,
    minHeight: 122,
    borderRadius: mobileTheme.radii.card,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
    justifyContent: "space-between",
    gap: 12
  },
  metricTilePressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }]
  },
  metricIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center"
  },
  metricCopy: {
    gap: 4
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0
  },
  metricValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
    color: mobileTheme.colors.ink
  },
  actionRow: {
    gap: 10
  },
  listHeader: {
    gap: 12
  },
  inlineEmptyState: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.border
  },
  inlineEmptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.surfaceTint
  },
  inlineEmptyCopy: {
    flex: 1,
    gap: 4
  },
  inlineEmptyTitle: {
    fontSize: mobileTheme.typography.body,
    lineHeight: 23,
    fontWeight: "800",
    color: mobileTheme.colors.ink
  },
  inlineEmptyBody: {
    fontSize: mobileTheme.typography.bodySmall,
    lineHeight: 21,
    color: mobileTheme.colors.mutedInk
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
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  leadAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.readySoft
  },
  leadAvatarText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    color: mobileTheme.colors.brandStrong
  },
  leadMeta: {
    flex: 1,
    gap: 4
  },
  leadName: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  leadContact: {
    fontSize: 13,
    lineHeight: 18,
    color: mobileTheme.colors.mutedInk
  }
})
