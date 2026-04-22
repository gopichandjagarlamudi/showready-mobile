import DateTimePicker from "@react-native-community/datetimepicker"
import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { Feather } from "@expo/vector-icons"
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import type { Appointment, Lead } from "@showready/contracts"
import { EmptyState } from "@/components/empty-state"
import { ScreenShell } from "@/components/screen-shell"
import { ActionButton } from "@/components/ui/action-button"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { FormField } from "@/components/ui/form-field"
import { InlineMessage } from "@/components/ui/inline-message"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { SurfaceCard } from "@/components/ui/surface-card"
import { StageChip } from "@/components/ui/stage-chip"
import { mobileTheme } from "@/lib/theme"
import { useMobileApi, useSession } from "@/providers/session-provider"

type AppointmentStatusFilter = "scheduled" | "completed" | "cancelled"
type AppointmentPicker = "date" | "time" | null

function padNumber(value: number) {
  return String(value).padStart(2, "0")
}

function formatApiDate(value: Date) {
  return `${value.getFullYear()}-${padNumber(value.getMonth() + 1)}-${padNumber(value.getDate())}`
}

function formatApiTime(value: Date) {
  return `${padNumber(value.getHours())}:${padNumber(value.getMinutes())}`
}

function formatDateLabel(value: Date | null) {
  if (!value) {
    return "Choose a date"
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(value)
}

function formatTimeLabel(value: Date | null) {
  if (!value) {
    return "Choose a time"
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(value)
}

function matchesLeadSearch(lead: Lead, query: string) {
  if (!query) {
    return true
  }

  return [lead.buyerName, lead.buyerEmail, lead.buyerPhone]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query)
}

export default function AppointmentsScreen() {
  const { session, workspaceVersion = 0 } = useSession()
  const api = useMobileApi()
  const [status, setStatus] = useState<AppointmentStatusFilter>("scheduled")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadSearchQuery, setLeadSearchQuery] = useState("")
  const deferredLeadSearchQuery = useDeferredValue(leadSearchQuery.trim().toLowerCase())
  const [selectedLeadId, setSelectedLeadId] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<Date | null>(null)
  const [showingAddress, setShowingAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [activePicker, setActivePicker] = useState<AppointmentPicker>(null)
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading")
  const [message, setMessage] = useState<{
    tone: "success" | "warning" | "error"
    title: string
    message: string
  } | null>(null)
  const [busyAppointmentId, setBusyAppointmentId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isScheduleSheetOpen, setIsScheduleSheetOpen] = useState(false)

  const eligibleLeads = useMemo(
    () => leads.filter((lead) => ["ready_to_show", "nurture", "hold"].includes(lead.pipelineStage)),
    [leads]
  )
  const filteredEligibleLeads = useMemo(
    () => eligibleLeads.filter((lead) => matchesLeadSearch(lead, deferredLeadSearchQuery)),
    [deferredLeadSearchQuery, eligibleLeads]
  )

  async function loadData(nextStatus = status) {
    if (!session) {
      return
    }

    try {
      const [appointmentRows, leadRows] = await Promise.all([
        api.listAppointments(nextStatus),
        api.listLeads(session.user.id)
      ])
      setAppointments(appointmentRows)
      setLeads(leadRows)
      setLoadState("ready")
    } catch (error) {
      setMessage({
        tone: "error",
        title: "Unable to load appointments",
        message: error instanceof Error ? error.message : "Try again."
      })
      setLoadState("error")
    }
  }

  useEffect(() => {
    void loadData(status)
  }, [session, status, workspaceVersion])

  async function handleSave() {
    if (!selectedLeadId || !selectedDate || !selectedTime || !showingAddress.trim()) {
      setMessage({
        tone: "warning",
        title: "Missing appointment details",
        message: "Pick a lead and add the date, time, and first showing address."
      })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      await api.saveAppointment({
        leadId: selectedLeadId,
        date: formatApiDate(selectedDate),
        startTime: formatApiTime(selectedTime),
        notes: notes.trim(),
        showings: [{ address: showingAddress.trim() }]
      })
      setLeadSearchQuery("")
      setSelectedLeadId("")
      setSelectedDate(null)
      setSelectedTime(null)
      setShowingAddress("")
      setNotes("")
      setActivePicker(null)
      setIsScheduleSheetOpen(false)
      setMessage({
        tone: "success",
        title: "Appointment saved",
        message: "The schedule is now live in the agent queue."
      })
      await loadData("scheduled")
      setStatus("scheduled")
    } catch (error) {
      setMessage({
        tone: "error",
        title: "Unable to save appointment",
        message: error instanceof Error ? error.message : "Try again."
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatusChange(
    appointmentId: string,
    nextStatus: "completed" | "cancelled"
  ) {
    setBusyAppointmentId(appointmentId)
    setMessage(null)

    try {
      await api.updateAppointmentStatus(appointmentId, nextStatus)
      setMessage({
        tone: "success",
        title: "Appointment updated",
        message: `Marked this appointment as ${nextStatus}.`
      })
      await loadData(status)
    } catch (error) {
      setMessage({
        tone: "error",
        title: "Unable to update appointment",
        message: error instanceof Error ? error.message : "Try again."
      })
    } finally {
      setBusyAppointmentId(null)
    }
  }

  function handlePickerChange(nextPicker: Exclude<AppointmentPicker, null>) {
    return (_event: { type?: string }, nextValue?: Date) => {
      if (_event?.type === "dismissed" || !nextValue) {
        if (Platform.OS !== "ios") {
          setActivePicker(null)
        }
        return
      }

      if (nextPicker === "date") {
        setSelectedDate(nextValue)
      } else {
        setSelectedTime(nextValue)
      }

      if (Platform.OS !== "ios") {
        setActivePicker(null)
      }
    }
  }

  return (
    <ScreenShell
      title="Appointments"
      testID="appointments-screen"
    >
      <SurfaceCard style={styles.schedulePromptCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Scheduling tools</Text>
          <Text style={styles.copy}>
            Keep the main screen focused on the queue, then open scheduling only when you need it.
          </Text>
        </View>
        <ActionButton
          label="Schedule showing"
          icon="calendar"
          onPress={() => setIsScheduleSheetOpen(true)}
          testID="appointments-open-schedule-sheet"
        />
      </SurfaceCard>

      {message ? (
        <InlineMessage tone={message.tone} title={message.title} message={message.message} />
      ) : null}

      <SegmentedControl
        value={status}
        onChange={setStatus}
        options={[
          { label: "Upcoming", value: "scheduled" },
          { label: "Completed", value: "completed" },
          { label: "Cancelled", value: "cancelled" }
        ]}
        testIDPrefix="appointments-tab"
      />

      {loadState === "loading" ? (
        <EmptyState title="Loading appointments" body="Pulling the current appointment queue." />
      ) : loadState === "error" ? (
        <EmptyState title="Appointments unavailable" body="Try again once the workspace reconnects." />
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No appointments in this tab"
          body="Schedule a showing or switch tabs to review completed and cancelled history."
          actionLabel="Schedule now"
          onAction={() => setIsScheduleSheetOpen(true)}
          variant="guided"
          eyebrow="Start here"
        />
      ) : (
        appointments.map((appointment) => (
          <SurfaceCard key={appointment.id} style={styles.card} testID={`appointment-card-${appointment.id}`}>
            <View style={styles.appointmentHeader}>
              <View style={styles.headerMeta}>
                <Text style={styles.name}>{appointment.lead.buyerName}</Text>
                <Text style={styles.meta}>
                  {appointment.date} at {appointment.startTime}
                </Text>
              </View>
              <StageChip stage={appointment.lead.pipelineStage} />
            </View>

            {appointment.notes ? <Text style={styles.meta}>{appointment.notes}</Text> : null}

            <View style={styles.showings}>
              {appointment.showings.map((showing, index) => (
                <View key={showing.id} style={styles.showingRow}>
                  <Text style={styles.showingIndex}>Stop {index + 1}</Text>
                  <Text style={styles.showingAddress}>{showing.address}</Text>
                  {showing.notes ? <Text style={styles.meta}>{showing.notes}</Text> : null}
                </View>
              ))}
            </View>

            {status === "scheduled" ? (
              <View style={styles.actionRow}>
                <ActionButton
                  label="Mark complete"
                  icon="check"
                  onPress={() => {
                    void handleStatusChange(appointment.id, "completed")
                  }}
                  disabled={busyAppointmentId === appointment.id}
                  testID={`appointment-complete-${appointment.id}`}
                />
                <ActionButton
                  label="Cancel"
                  icon="x"
                  tone="danger"
                  onPress={() => {
                    void handleStatusChange(appointment.id, "cancelled")
                  }}
                  disabled={busyAppointmentId === appointment.id}
                  testID={`appointment-cancel-${appointment.id}`}
                />
              </View>
            ) : null}
          </SurfaceCard>
        ))
      )}
      <BottomSheet
        visible={isScheduleSheetOpen}
        onClose={() => setIsScheduleSheetOpen(false)}
        title="Create appointment"
        subtitle="Pick the lead first, then fill the minimal showing details."
        testID="appointments-schedule-sheet"
      >
        <View style={styles.searchGroup}>
          <Text style={styles.fieldLabel}>Search leads</Text>
          <View style={styles.searchInputShell}>
            <Feather name="search" size={16} color={mobileTheme.colors.mutedInk} />
            <TextInput
              testID="appointment-lead-search-input"
              value={leadSearchQuery}
              onChangeText={setLeadSearchQuery}
              placeholder="Search by name, email, or phone"
              placeholderTextColor={mobileTheme.colors.mutedInk}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={styles.searchInput}
            />
          </View>
        </View>

        {eligibleLeads.length === 0 ? (
          <InlineMessage
            tone="warning"
            title="No eligible leads"
            message="Move a lead into Ready, Nurture, or Hold before scheduling from mobile."
          />
        ) : filteredEligibleLeads.length === 0 ? (
          <InlineMessage
            tone="warning"
            title="No leads match this search"
            message="Try a different name, email, phone number, or clear the search."
          />
        ) : (
          <View style={styles.leadPicker}>
            {filteredEligibleLeads.map((lead) => {
              const isSelected = selectedLeadId === lead.id

              return (
                <Pressable
                  key={lead.id}
                  testID={`appointment-lead-option-${lead.id}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSelectedLeadId(lead.id)}
                  style={[styles.leadOption, isSelected ? styles.leadOptionSelected : null]}
                >
                  <View style={styles.leadOptionCopy}>
                    <Text
                      style={[
                        styles.leadOptionLabel,
                        isSelected ? styles.leadOptionLabelSelected : null
                      ]}
                    >
                      {lead.buyerName}
                    </Text>
                    <Text style={styles.leadOptionMeta}>
                      {lead.buyerEmail ?? lead.buyerPhone ?? "Awaiting contact details"}
                    </Text>
                  </View>
                  <StageChip stage={lead.pipelineStage} recommendation={lead.recommendation} />
                </Pressable>
              )
            })}
          </View>
        )}

        <View style={styles.pickerGroup}>
          <Text style={styles.fieldLabel}>Date</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open appointment date picker"
            onPress={() => setActivePicker((current) => (current === "date" ? null : "date"))}
            style={({ pressed }) => [styles.pickerField, pressed ? styles.pressed : null]}
            testID="appointment-open-date-picker"
          >
            <View style={styles.pickerFieldCopy}>
              <Text style={styles.pickerValue}>{formatDateLabel(selectedDate)}</Text>
              <Text style={styles.pickerHint}>Use the local showing date.</Text>
            </View>
            <Feather name="calendar" size={18} color={mobileTheme.colors.mutedInk} />
          </Pressable>
          {activePicker === "date" ? (
            <View style={styles.nativePickerShell}>
              <DateTimePicker
                testID="appointment-native-date-picker"
                mode="date"
                value={selectedDate ?? new Date()}
                onChange={handlePickerChange("date")}
              />
              {Platform.OS === "ios" ? (
                <ActionButton
                  label="Done with date"
                  tone="secondary"
                  onPress={() => setActivePicker(null)}
                  testID="appointment-close-date-picker"
                />
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.pickerGroup}>
          <Text style={styles.fieldLabel}>Start time</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open appointment time picker"
            onPress={() => setActivePicker((current) => (current === "time" ? null : "time"))}
            style={({ pressed }) => [styles.pickerField, pressed ? styles.pressed : null]}
            testID="appointment-open-time-picker"
          >
            <View style={styles.pickerFieldCopy}>
              <Text style={styles.pickerValue}>{formatTimeLabel(selectedTime)}</Text>
              <Text style={styles.pickerHint}>Use the native clock to avoid manual typing.</Text>
            </View>
            <Feather name="clock" size={18} color={mobileTheme.colors.mutedInk} />
          </Pressable>
          {activePicker === "time" ? (
            <View style={styles.nativePickerShell}>
              <DateTimePicker
                testID="appointment-native-time-picker"
                mode="time"
                value={selectedTime ?? new Date()}
                onChange={handlePickerChange("time")}
              />
              {Platform.OS === "ios" ? (
                <ActionButton
                  label="Done with time"
                  tone="secondary"
                  onPress={() => setActivePicker(null)}
                  testID="appointment-close-time-picker"
                />
              ) : null}
            </View>
          ) : null}
        </View>
        <FormField
          label="First showing address"
          value={showingAddress}
          onChangeText={setShowingAddress}
          placeholder="123 Queen St W, Toronto"
          helperText="Add the first stop only. Extra logistics can live in notes."
          autoComplete="street-address"
          testID="appointment-address-input"
        />
        <FormField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional access notes"
          helperText="Use this for lockbox or client timing notes."
          multiline
          testID="appointment-notes-input"
        />
        <ActionButton
          label={isSaving ? "Saving appointment..." : "Save appointment"}
          icon="calendar"
          onPress={() => {
            void handleSave()
          }}
          disabled={isSaving || eligibleLeads.length === 0}
          testID="appointment-save-button"
        />
      </BottomSheet>
    </ScreenShell>
  )
}

const styles = StyleSheet.create({
  schedulePromptCard: {
    gap: 16
  },
  formCard: {
    gap: 16
  },
  sectionHeader: {
    gap: 4
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
    paddingRight: 14,
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
  leadPicker: {
    gap: 10
  },
  leadOption: {
    minHeight: 64,
    borderRadius: mobileTheme.radii.control,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  leadOptionSelected: {
    borderColor: mobileTheme.colors.brand,
    backgroundColor: mobileTheme.colors.surfaceTint
  },
  leadOptionCopy: {
    flex: 1,
    gap: 4
  },
  leadOptionLabel: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  leadOptionLabelSelected: {
    color: mobileTheme.colors.brandStrong
  },
  leadOptionMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: mobileTheme.colors.mutedInk
  },
  pickerGroup: {
    gap: 8
  },
  pickerField: {
    minHeight: 72,
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
  pickerFieldCopy: {
    flex: 1,
    gap: 4
  },
  pickerValue: {
    fontSize: 16,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  pickerHint: {
    fontSize: 13,
    lineHeight: 18,
    color: mobileTheme.colors.mutedInk
  },
  nativePickerShell: {
    borderRadius: mobileTheme.radii.control,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    padding: 12,
    gap: 10
  },
  card: {
    gap: 14
  },
  appointmentHeader: {
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
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  meta: {
    fontSize: 14,
    lineHeight: 21,
    color: mobileTheme.colors.mutedInk
  },
  showings: {
    gap: 10
  },
  showingRow: {
    borderRadius: mobileTheme.radii.control,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    padding: 14,
    gap: 4
  },
  showingIndex: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: mobileTheme.colors.brandStrong
  },
  showingAddress: {
    fontSize: 15,
    lineHeight: 22,
    color: mobileTheme.colors.ink
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }]
  }
})
