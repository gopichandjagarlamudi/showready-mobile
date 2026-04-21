import { useEffect, useMemo, useState } from "react"
import { StyleSheet, Switch, Text, View } from "react-native"
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
  emailNotificationsEnabled: boolean
}

const emptyForm: FormState = {
  fullName: "",
  brokerage: "",
  licenseNumber: "",
  emailNotificationsEnabled: false
}

export default function SettingsScreen() {
  const { session, signOut } = useSession()
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
  const [isSigningOut, setIsSigningOut] = useState(false)

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
        emailNotificationsEnabled: boolean
      }) => {
        if (!isMounted) {
          return
        }

        const nextForm = {
          fullName: settings.fullName,
          brokerage: settings.brokerage ?? "",
          licenseNumber: settings.licenseNumber ?? "",
          emailNotificationsEnabled: settings.emailNotificationsEnabled
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
        emailNotificationsEnabled: form.emailNotificationsEnabled
      })
      const nextSaved = {
        fullName: form.fullName.trim(),
        brokerage: form.brokerage.trim(),
        licenseNumber: form.licenseNumber.trim(),
        emailNotificationsEnabled: form.emailNotificationsEnabled
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

  async function handleSignOut() {
    setIsSigningOut(true)
    setMessage(null)

    try {
      await signOut()
    } catch (error) {
      setMessage({
        tone: "error",
        title: "Unable to sign out",
        message: error instanceof Error ? error.message : "Try again."
      })
    } finally {
      setIsSigningOut(false)
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
        <ActionButton
          label={isSigningOut ? "Signing out..." : "Sign out"}
          tone="danger"
          icon="log-out"
          onPress={() => {
            void handleSignOut()
          }}
          disabled={isSigningOut}
          testID="settings-sign-out-button"
        />
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
            textContentType="name"
            autoComplete="name"
            testID="settings-full-name-input"
          />
          <FormField
            label="Brokerage"
            value={form.brokerage}
            onChangeText={(brokerage: string) => setForm((current) => ({ ...current, brokerage }))}
            placeholder="Northline Realty"
            textContentType="organizationName"
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
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceCopy}>
              <Text style={styles.preferenceTitle}>Also send email notification</Text>
              <Text style={styles.preferenceBody}>
                Send an email copy when a new lead submits the generated intake form.
              </Text>
            </View>
            <Switch
              testID="settings-email-notifications-toggle"
              value={form.emailNotificationsEnabled}
              onValueChange={(emailNotificationsEnabled: boolean) =>
                setForm((current) => ({ ...current, emailNotificationsEnabled }))
              }
              trackColor={{
                false: mobileTheme.colors.borderStrong,
                true: mobileTheme.colors.brand
              }}
            />
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
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16
  },
  preferenceCopy: {
    flex: 1,
    gap: 4
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  preferenceBody: {
    fontSize: 13,
    lineHeight: 19,
    color: mobileTheme.colors.mutedInk
  }
})
