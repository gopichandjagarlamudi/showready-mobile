import { useEffect, useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { EmptyState } from "@/components/empty-state"
import { ScreenShell } from "@/components/screen-shell"
import { ActionButton } from "@/components/ui/action-button"
import { FormField } from "@/components/ui/form-field"
import { InlineMessage } from "@/components/ui/inline-message"
import { SurfaceCard } from "@/components/ui/surface-card"
import { mobileTheme } from "@/lib/theme"
import { useMobileApi, useSession } from "@/providers/session-provider"

type FormState = {
  fullName: string
  brokerage: string
  licenseNumber: string
  notificationPreference: "email" | "email_and_push"
}

const emptyForm: FormState = {
  fullName: "",
  brokerage: "",
  licenseNumber: "",
  notificationPreference: "email"
}

export default function SettingsScreen() {
  const { session } = useSession()
  const api = useMobileApi()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [savedForm, setSavedForm] = useState<FormState>(emptyForm)
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading")
  const [message, setMessage] = useState<{
    tone: "success" | "error"
    title: string
    message: string
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm]
  )

  useEffect(() => {
    let isMounted = true

    api
      .getSettings()
      .then((settings: {
        fullName: string
        brokerage?: string
        licenseNumber?: string
        notificationPreference: "email" | "email_and_push"
      }) => {
        if (!isMounted) {
          return
        }

        const nextForm = {
          fullName: settings.fullName,
          brokerage: settings.brokerage ?? "",
          licenseNumber: settings.licenseNumber ?? "",
          notificationPreference: settings.notificationPreference
        } satisfies FormState

        setForm(nextForm)
        setSavedForm(nextForm)
        setLoadState("ready")
      })
      .catch((error: Error) => {
        if (!isMounted) {
          return
        }

        setMessage({
          tone: "error",
          title: "Unable to load settings",
          message: error.message
        })
        setLoadState("error")
      })

    return () => {
      isMounted = false
    }
  }, [api])

  async function save() {
    if (!form.fullName.trim()) {
      setMessage({
        tone: "error",
        title: "Full name required",
        message: "Add the full name that should appear across the mobile workspace."
      })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      await api.saveSettings({
        fullName: form.fullName.trim(),
        brokerage: form.brokerage.trim(),
        licenseNumber: form.licenseNumber.trim(),
        notificationPreference: form.notificationPreference
      })
      const nextSaved = {
        fullName: form.fullName.trim(),
        brokerage: form.brokerage.trim(),
        licenseNumber: form.licenseNumber.trim(),
        notificationPreference: form.notificationPreference
      }
      setForm(nextSaved)
      setSavedForm(nextSaved)
      setMessage({
        tone: "success",
        title: "Settings saved",
        message: "Your mobile profile is aligned with the backend workspace."
      })
    } catch (error) {
      setMessage({
        tone: "error",
        title: "Unable to save settings",
        message: error instanceof Error ? error.message : "Try again."
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ScreenShell
      title="Settings"
      subtitle="Keep your mobile profile clean and accurate without carrying the full desktop admin surface."
      testID="settings-screen"
    >
      <SurfaceCard style={styles.identityCard}>
        <Text style={styles.identityEyebrow}>Signed in identity</Text>
        <Text style={styles.identityEmail}>{session?.user.email ?? "Unknown email"}</Text>
        <Text style={styles.identityMeta}>
          Profile updates stay scoped to this signed-in account.
        </Text>
      </SurfaceCard>

      {message ? (
        <InlineMessage tone={message.tone} title={message.title} message={message.message} />
      ) : null}

      {loadState === "loading" ? (
        <EmptyState title="Loading settings" body="Pulling the current profile from Supabase." />
      ) : loadState === "error" ? (
        <EmptyState
          title="Settings unavailable"
          body="Try again once the workspace reconnects."
        />
      ) : (
        <SurfaceCard style={styles.formCard}>
          <Text style={styles.sectionTitle}>Profile maintenance</Text>
          <FormField
            label="Full name"
            value={form.fullName}
            onChangeText={(fullName: string) => setForm((current) => ({ ...current, fullName }))}
            placeholder="Demo Agent"
            testID="settings-full-name-input"
          />
          <FormField
            label="Brokerage"
            value={form.brokerage}
            onChangeText={(brokerage: string) => setForm((current) => ({ ...current, brokerage }))}
            placeholder="Northline Realty"
            testID="settings-brokerage-input"
          />
          <FormField
            label="License number"
            value={form.licenseNumber}
            onChangeText={(licenseNumber: string) =>
              setForm((current) => ({ ...current, licenseNumber }))
            }
            placeholder="SR-2026-001"
            testID="settings-license-number-input"
          />

          <View style={styles.preferenceGroup}>
            <Text style={styles.preferenceLabel}>Notification preference</Text>
            <View style={styles.preferenceRow}>
              {[
                { label: "Email", value: "email" as const },
                { label: "Email + push", value: "email_and_push" as const }
              ].map((option) => {
                const isSelected = form.notificationPreference === option.value

                return (
                  <Pressable
                    key={option.value}
                    testID={`settings-notification-${option.value}`}
                    accessibilityRole="button"
                    onPress={() =>
                      setForm((current) => ({
                        ...current,
                        notificationPreference: option.value
                      }))
                    }
                    style={[
                      styles.preferenceChip,
                      isSelected ? styles.preferenceChipSelected : null
                    ]}
                  >
                    <Text
                      style={[
                        styles.preferenceText,
                        isSelected ? styles.preferenceTextSelected : null
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <ActionButton
            label={isSaving ? "Saving settings..." : "Save settings"}
            onPress={() => {
              void save()
            }}
            disabled={isSaving || !isDirty}
            testID="settings-save-button"
          />
        </SurfaceCard>
      )}
    </ScreenShell>
  )
}

const styles = StyleSheet.create({
  identityCard: {
    gap: 8
  },
  identityEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: mobileTheme.colors.accent
  },
  identityEmail: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  identityMeta: {
    fontSize: 14,
    lineHeight: 21,
    color: mobileTheme.colors.mutedInk
  },
  formCard: {
    gap: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  preferenceGroup: {
    gap: 10
  },
  preferenceLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: mobileTheme.colors.mutedInk
  },
  preferenceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  preferenceChip: {
    borderRadius: mobileTheme.radii.pill,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 11
  },
  preferenceChipSelected: {
    borderColor: mobileTheme.colors.brand,
    backgroundColor: mobileTheme.colors.readySoft
  },
  preferenceText: {
    fontSize: 13,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  preferenceTextSelected: {
    color: mobileTheme.colors.brand
  }
})
