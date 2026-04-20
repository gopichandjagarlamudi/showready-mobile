import { useEffect, useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import type { Appointment, Lead } from "@showready/contracts"
import { EmptyState } from "@/components/empty-state"
import { ScreenShell } from "@/components/screen-shell"
import { ActionButton } from "@/components/ui/action-button"
import { FormField } from "@/components/ui/form-field"
import { InlineMessage } from "@/components/ui/inline-message"
import { SurfaceCard } from "@/components/ui/surface-card"
import { StageChip } from "@/components/ui/stage-chip"
import { mobileTheme } from "@/lib/theme"
import { useMobileApi, useSession } from "@/providers/session-provider"

type AppointmentStatusFilter = "scheduled" | "completed" | "cancelled"

export default function AppointmentsScreen() {
  const { session } = useSession()
  const api = useMobileApi()
  const [status, setStatus] = useState<AppointmentStatusFilter>("scheduled")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState("")
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [showingAddress, setShowingAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading")
  const [message, setMessage] = useState<{
    tone: "success" | "warning" | "error"
    title: string
    message: string
  } | null>(null)
  const [busyAppointmentId, setBusyAppointmentId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const eligibleLeads = useMemo(
    () =>
      leads.filter((lead) =>
        ["ready_to_show", "nurture", "hold"].includes(lead.pipelineStage)
      ),
    [leads]
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
  }, [session, status])

  async function handleSave() {
    if (!selectedLeadId || !date.trim() || !startTime.trim() || !showingAddress.trim()) {
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
        date: date.trim(),
        startTime: startTime.trim(),
        notes: notes.trim(),
        showings: [{ address: showingAddress.trim() }]
      })
      setSelectedLeadId("")
      setDate("")
      setStartTime("")
      setShowingAddress("")
      setNotes("")
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

  return (
    <ScreenShell
      title="Appointments"
      subtitle="Schedule showings from mobile, then complete or cancel them without losing the lead context."
      testID="appointments-screen"
    >
      <View style={styles.toggleRow}>
        <ActionButton
          label="Upcoming"
          tone={status === "scheduled" ? "primary" : "secondary"}
          onPress={() => setStatus("scheduled")}
          testID="appointments-tab-scheduled"
        />
        <ActionButton
          label="Completed"
          tone={status === "completed" ? "primary" : "secondary"}
          onPress={() => setStatus("completed")}
          testID="appointments-tab-completed"
        />
        <ActionButton
          label="Cancelled"
          tone={status === "cancelled" ? "primary" : "secondary"}
          onPress={() => setStatus("cancelled")}
          testID="appointments-tab-cancelled"
        />
      </View>

      {message ? (
        <InlineMessage
          tone={message.tone}
          title={message.title}
          message={message.message}
        />
      ) : null}

      <SurfaceCard style={styles.formCard}>
        <Text style={styles.sectionTitle}>Create appointment</Text>
        {eligibleLeads.length === 0 ? (
          <InlineMessage
            tone="warning"
            title="No eligible leads"
            message="Move a lead into Ready, Nurture, or Hold before scheduling from mobile."
          />
        ) : (
          <View style={styles.leadPicker}>
            {eligibleLeads.map((lead) => {
              const isSelected = selectedLeadId === lead.id

              return (
                <Pressable
                  key={lead.id}
                  testID={`appointment-lead-option-${lead.id}`}
                  accessibilityRole="button"
                  onPress={() => setSelectedLeadId(lead.id)}
                  style={[styles.leadOption, isSelected ? styles.leadOptionSelected : null]}
                >
                  <Text
                    style={[styles.leadOptionLabel, isSelected ? styles.leadOptionLabelSelected : null]}
                  >
                    {lead.buyerName}
                  </Text>
                  <StageChip stage={lead.pipelineStage} recommendation={lead.recommendation} />
                </Pressable>
              )
            })}
          </View>
        )}
        <FormField
          label="Date"
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
          autoCorrect={false}
          testID="appointment-date-input"
        />
        <FormField
          label="Start time"
          value={startTime}
          onChangeText={setStartTime}
          placeholder="HH:MM"
          autoCapitalize="none"
          autoCorrect={false}
          testID="appointment-start-time-input"
        />
        <FormField
          label="First showing address"
          value={showingAddress}
          onChangeText={setShowingAddress}
          placeholder="123 Queen St W, Toronto"
          testID="appointment-address-input"
        />
        <FormField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional access notes"
          multiline
          testID="appointment-notes-input"
        />
        <ActionButton
          label={isSaving ? "Saving appointment..." : "Save appointment"}
          onPress={() => {
            void handleSave()
          }}
          disabled={isSaving || eligibleLeads.length === 0}
          testID="appointment-save-button"
        />
      </SurfaceCard>

      {loadState === "loading" ? (
        <EmptyState title="Loading appointments" body="Pulling the current appointment queue." />
      ) : loadState === "error" ? (
        <EmptyState title="Appointments unavailable" body="Try again once the workspace reconnects." />
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No appointments in this tab"
          body="Schedule a showing or switch tabs to review completed and cancelled history."
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
              <View style={styles.actions}>
                <ActionButton
                  label={
                    busyAppointmentId === appointment.id
                      ? "Updating..."
                      : "Mark completed"
                  }
                  tone="secondary"
                  onPress={() => {
                    void handleStatusChange(appointment.id, "completed")
                  }}
                  disabled={busyAppointmentId === appointment.id}
                  testID={`appointment-complete-${appointment.id}`}
                />
                <ActionButton
                  label="Cancel"
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
    </ScreenShell>
  )
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  formCard: {
    gap: 14
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  leadPicker: {
    gap: 10
  },
  leadOption: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surfaceStrong,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8
  },
  leadOptionSelected: {
    borderColor: mobileTheme.colors.brand,
    backgroundColor: mobileTheme.colors.readySoft
  },
  leadOptionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  leadOptionLabelSelected: {
    color: mobileTheme.colors.brand
  },
  card: {
    gap: 12
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
    fontSize: 20,
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
    borderRadius: 18,
    backgroundColor: mobileTheme.colors.surfaceStrong,
    padding: 14,
    gap: 4
  },
  showingIndex: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: mobileTheme.colors.accent
  },
  showingAddress: {
    fontSize: 15,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  }
})
