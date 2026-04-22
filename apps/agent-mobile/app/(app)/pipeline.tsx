import { Feather } from "@expo/vector-icons"
import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"
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

type PipelineTab = "active" | "resolved"
type PipelineCategoryStage =
  | (typeof ACTIVE_SECTIONS)[number]["stage"]
  | (typeof RESOLVED_SECTIONS)[number]["stage"]
type PipelineCategoryValue = "all" | PipelineCategoryStage
type PipelineCategoryOption = {
  value: PipelineCategoryValue
  label: string
  count: number
  description: string
}

function getSectionsForTab(tab: PipelineTab) {
  return tab === "active" ? ACTIVE_SECTIONS : RESOLVED_SECTIONS
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

function getCategoryDescription(tab: PipelineTab, label: string, isAll: boolean) {
  if (isAll) {
    return tab === "active"
      ? "See every active lane in one searchable mobile list."
      : "Review every resolved outcome without scrolling through sections."
  }

  return `Only ${label.toLowerCase()} leads stay in view.`
}

function getEmptyState(tab: PipelineTab, category: PipelineCategoryOption, searchQuery: string) {
  if (searchQuery.trim().length > 0) {
    return {
      title: "No leads match this search yet.",
      body: "Try a name, email, phone number, or a broader category.",
      eyebrow: "Search"
    }
  }

  if (category.value !== "all") {
    return {
      title: `No ${category.label.toLowerCase()} leads yet.`,
      body: `Switch categories or move a lead into ${category.label.toLowerCase()} to review it here.`,
      eyebrow: "Category"
    }
  }

  return tab === "active"
    ? {
        title: "Active pipeline is clear",
        body: "Freshly reviewed leads will appear here once they move beyond the new-leads queue.",
        eyebrow: "Active view"
      }
    : {
        title: "Resolved pipeline is clear",
        body: "Closed and archived leads will appear here once the pipeline starts cycling.",
        eyebrow: "Resolved view"
      }
}

function getResultsSummary(
  tab: PipelineTab,
  category: PipelineCategoryOption,
  filteredCount: number,
  totalCount: number,
  searchQuery: string
) {
  const trimmedQuery = searchQuery.trim()

  if (trimmedQuery.length > 0) {
    return `Showing ${filteredCount} of ${totalCount} leads for "${trimmedQuery}".`
  }

  if (category.value === "all") {
    return `Showing ${filteredCount} ${tab} leads.`
  }

  return `Showing ${filteredCount} ${category.label.toLowerCase()} leads.`
}

function matchesSearch(lead: Lead, query: string) {
  if (!query) {
    return true
  }

  const displayStage = getPipelineDisplayStage(lead)
  const searchHaystack = [
    lead.buyerName,
    lead.buyerEmail,
    lead.buyerPhone,
    lead.summary,
    lead.recommendation,
    displayStage?.replaceAll("_", " ")
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return searchHaystack.includes(query)
}

function sortLeadsForTab(leads: Lead[], tab: PipelineTab) {
  const sectionOrder = new Map(getSectionsForTab(tab).map((section, index) => [section.stage, index]))

  return [...leads]
    .filter((lead) => {
      const displayStage = getPipelineDisplayStage(lead)
      return displayStage ? sectionOrder.has(displayStage) : false
    })
    .sort((left, right) => {
      const leftStage = getPipelineDisplayStage(left)
      const rightStage = getPipelineDisplayStage(right)
      const leftOrder = leftStage ? sectionOrder.get(leftStage) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER
      const rightOrder =
        rightStage ? sectionOrder.get(rightStage) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder
      }

      const leftTimestamp = left.updatedAt ?? left.createdAt ?? left.submittedAt ?? ""
      const rightTimestamp = right.updatedAt ?? right.createdAt ?? right.submittedAt ?? ""

      return rightTimestamp.localeCompare(leftTimestamp)
    })
}

function getCategoryOptions(leads: Lead[], tab: PipelineTab): PipelineCategoryOption[] {
  const sections = getSectionsForTab(tab)

  return [
    {
      value: "all",
      label: tab === "active" ? "All active" : "All resolved",
      count: leads.length,
      description: getCategoryDescription(tab, tab === "active" ? "active" : "resolved", true)
    },
    ...sections.map((section) => ({
      value: section.stage,
      label: section.label,
      count: leads.filter((lead) => getPipelineDisplayStage(lead) === section.stage).length,
      description: getCategoryDescription(tab, section.label, false)
    }))
  ]
}

export default function PipelineScreen() {
  const { session, workspaceVersion = 0 } = useSession()
  const api = useMobileApi()
  const [leads, setLeads] = useState<Lead[]>([])
  const [tab, setTab] = useState<PipelineTab>("active")
  const [selectedCategory, setSelectedCategory] = useState<PipelineCategoryValue>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const deferredSearchQuery = useDeferredValue(searchQuery.trim().toLowerCase())
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyLeadId, setBusyLeadId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false)

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

  useEffect(() => {
    setSelectedCategory("all")
    setIsCategorySheetOpen(false)
  }, [tab])

  const tabLeads = useMemo(() => sortLeadsForTab(leads, tab), [leads, tab])
  const categoryOptions = useMemo(() => getCategoryOptions(tabLeads, tab), [tabLeads, tab])
  const activeCategory =
    categoryOptions.find((option) => option.value === selectedCategory) ?? categoryOptions[0]

  const filteredLeads = useMemo(
    () =>
      tabLeads.filter((lead) => {
        if (selectedCategory !== "all" && getPipelineDisplayStage(lead) !== selectedCategory) {
          return false
        }

        return matchesSearch(lead, deferredSearchQuery)
      }),
    [deferredSearchQuery, selectedCategory, tabLeads]
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
      setLeads((current) => current.map((lead) => (lead.id === leadId ? result.lead : lead)))
      setMessage(`Moved ${result.lead.buyerName} to ${stage.replaceAll("_", " ")}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to move lead.")
    } finally {
      setBusyLeadId(null)
    }
  }

  const searchIsActive = searchQuery.trim().length > 0
  const emptyState = getEmptyState(tab, activeCategory, searchQuery)

  return (
    <ScreenShell
      title="Pipeline"
      testID="pipeline-screen"
    >
      <SegmentedControl
        value={tab}
        onChange={(value) => setTab(value as PipelineTab)}
        options={[
          { label: "Active", value: "active" },
          { label: "Resolved", value: "resolved" }
        ]}
        testIDPrefix="pipeline-tab"
      />

      <SurfaceCard style={styles.filtersCard}>
        <View style={styles.filtersHeader}>
          <View style={styles.filtersCopy}>
            <Text style={styles.filtersTitle}>Find a lead fast</Text>
            <Text style={styles.filtersBody}>
              Search the visible pipeline and narrow it to a single category before you open cards.
            </Text>
          </View>
          <View style={styles.resultsPill}>
            <Text style={styles.resultsPillValue}>{filteredLeads.length}</Text>
            <Text style={styles.resultsPillLabel}>shown</Text>
          </View>
        </View>

        <View style={styles.searchGroup}>
          <Text style={styles.fieldLabel}>Search leads</Text>
          <View style={styles.searchInputShell}>
            <Feather name="search" size={16} color={mobileTheme.colors.mutedInk} />
            <TextInput
              testID="pipeline-search-input"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Name, email, phone, or notes"
              placeholderTextColor={mobileTheme.colors.mutedInk}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {searchIsActive ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear lead search"
                onPress={() => setSearchQuery("")}
                style={({ pressed }) => [styles.clearSearchButton, pressed ? styles.pressed : null]}
                testID="pipeline-clear-search"
              >
                <Feather name="x" size={16} color={mobileTheme.colors.mutedInk} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open category filter"
          onPress={() => setIsCategorySheetOpen(true)}
          style={({ pressed }) => [styles.categoryPicker, pressed ? styles.pressed : null]}
          testID="pipeline-open-category-sheet"
        >
          <View style={styles.categoryPickerCopy}>
            <Text style={styles.fieldLabel}>Category</Text>
            <Text style={styles.categoryPickerValue}>{activeCategory.label}</Text>
            <Text style={styles.categoryPickerHint}>{activeCategory.description}</Text>
          </View>
          <View style={styles.categoryPickerMeta}>
            <Text style={styles.categoryPickerCount}>{activeCategory.count}</Text>
            <Feather name="chevron-down" size={16} color={mobileTheme.colors.mutedInk} />
          </View>
        </Pressable>

        <Text style={styles.resultsSummary}>
          {getResultsSummary(tab, activeCategory, filteredLeads.length, activeCategory.count, searchQuery)}
        </Text>
      </SurfaceCard>

      {message ? <InlineMessage tone="warning" title="Pipeline update" message={message} /> : null}

      {loadState === "loading" ? (
        <EmptyState title="Loading pipeline" body="Pulling the latest lead movement from the workspace." />
      ) : loadState === "error" ? (
        <EmptyState title="Pipeline unavailable" body={loadError ?? "Try again."} />
      ) : filteredLeads.length === 0 ? (
        <EmptyState
          title={emptyState.title}
          body={emptyState.body}
          eyebrow={emptyState.eyebrow}
          variant="guided"
        />
      ) : (
        <View style={styles.leadList}>
          {filteredLeads.map((lead) => {
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
          })}
        </View>
      )}

      <BottomSheet
        visible={isCategorySheetOpen}
        onClose={() => setIsCategorySheetOpen(false)}
        title={tab === "active" ? "Filter active leads" : "Filter resolved leads"}
        subtitle="Pick one lane to keep the list short and thumb-friendly on mobile."
        testID="pipeline-category-sheet"
      >
        <View style={styles.categoryOptions}>
          {categoryOptions.map((option) => {
            const isSelected = activeCategory.value === option.value

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  setSelectedCategory(option.value)
                  setIsCategorySheetOpen(false)
                }}
                style={({ pressed }) => [
                  styles.categoryOption,
                  isSelected ? styles.categoryOptionSelected : null,
                  pressed ? styles.pressed : null
                ]}
                testID={`pipeline-category-option-${option.value}`}
              >
                <View style={styles.categoryOptionCopy}>
                  <Text style={[styles.categoryOptionTitle, isSelected ? styles.categoryOptionTitleSelected : null]}>
                    {option.label}
                  </Text>
                  <Text style={styles.categoryOptionDescription}>{option.description}</Text>
                </View>
                <View style={styles.categoryOptionMeta}>
                  <Text style={styles.categoryOptionCount}>{option.count}</Text>
                  <Feather
                    name={isSelected ? "check" : "chevron-right"}
                    size={16}
                    color={isSelected ? mobileTheme.colors.brandStrong : mobileTheme.colors.mutedInk}
                  />
                </View>
              </Pressable>
            )
          })}
        </View>
      </BottomSheet>

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
  filtersCard: {
    gap: 14
  },
  filtersHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  filtersCopy: {
    flex: 1,
    gap: 4
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  filtersBody: {
    fontSize: 14,
    lineHeight: 21,
    color: mobileTheme.colors.mutedInk
  },
  resultsPill: {
    minWidth: 74,
    borderRadius: mobileTheme.radii.control,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.surfaceTint,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border
  },
  resultsPillValue: {
    fontSize: 20,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  resultsPillLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: mobileTheme.colors.brandStrong
  },
  searchGroup: {
    gap: 8
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: mobileTheme.colors.subtleInk
  },
  searchInputShell: {
    minHeight: 52,
    borderRadius: mobileTheme.radii.control,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surface,
    paddingLeft: 14,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  searchInput: {
    flex: 1,
    minHeight: 52,
    color: mobileTheme.colors.ink,
    fontSize: mobileTheme.typography.body
  },
  clearSearchButton: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: mobileTheme.radii.pill,
    alignItems: "center",
    justifyContent: "center"
  },
  categoryPicker: {
    minHeight: 78,
    borderRadius: mobileTheme.radii.control,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surfaceTint,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  categoryPickerCopy: {
    flex: 1,
    gap: 4
  },
  categoryPickerValue: {
    fontSize: 17,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  categoryPickerHint: {
    fontSize: 13,
    lineHeight: 18,
    color: mobileTheme.colors.mutedInk
  },
  categoryPickerMeta: {
    alignItems: "center",
    gap: 8
  },
  categoryPickerCount: {
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
    textAlign: "center",
    backgroundColor: mobileTheme.colors.surfaceMuted,
    color: mobileTheme.colors.mutedInk,
    fontSize: 13,
    fontWeight: "700"
  },
  resultsSummary: {
    fontSize: 13,
    lineHeight: 18,
    color: mobileTheme.colors.brandStrong
  },
  leadList: {
    gap: 12
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
  categoryOptions: {
    gap: 10
  },
  categoryOption: {
    minHeight: 76,
    borderRadius: mobileTheme.radii.control,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  categoryOptionSelected: {
    backgroundColor: mobileTheme.colors.surfaceTint,
    borderColor: mobileTheme.colors.borderStrong
  },
  categoryOptionCopy: {
    flex: 1,
    gap: 4
  },
  categoryOptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  categoryOptionTitleSelected: {
    color: mobileTheme.colors.brandStrong
  },
  categoryOptionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: mobileTheme.colors.mutedInk
  },
  categoryOptionMeta: {
    alignItems: "center",
    gap: 8
  },
  categoryOptionCount: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
    textAlign: "center",
    backgroundColor: mobileTheme.colors.surfaceMuted,
    color: mobileTheme.colors.mutedInk,
    fontSize: 13,
    fontWeight: "700"
  },
  sheetActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }]
  }
})
