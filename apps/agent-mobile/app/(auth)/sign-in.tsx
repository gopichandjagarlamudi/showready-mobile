import { useState, useTransition } from "react"
import { StyleSheet, Text } from "react-native"
import { mobileTheme } from "@showready/design-system"
import { ActionButton } from "../../components/ui/action-button"
import { FormField } from "../../components/ui/form-field"
import { SurfaceCard } from "../../components/ui/surface-card"
import { ScreenShell } from "../../components/screen-shell"
import { signInWithGoogle } from "../../lib/auth-oauth"
import { captureDiagnosticsError } from "../../lib/diagnostics/service"
import { supabase } from "../../lib/supabase"

export default function SignInScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleEmailSignIn() {
    setError(null)
    startTransition(async () => {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        void captureDiagnosticsError(signInError, {
          eventType: "auth.event",
          category: "auth",
          severity: "error",
          context: {
            method: "password"
          }
        })
        setError(signInError.message)
      }
    })
  }

  function handleGoogleSignIn() {
    setError(null)
    startTransition(async () => {
      const result = await signInWithGoogle()

      if (result.type === "error") {
        void captureDiagnosticsError(new Error(result.message), {
          eventType: "auth.event",
          category: "auth",
          severity: "error",
          context: {
            method: "google"
          }
        })
        setError(result.message)
      }
    })
  }

  return (
    <ScreenShell
      title="Sign in"
      subtitle="Access the field dashboard with the same ShowReady account and keep authentication simple on mobile."
      testID="sign-in-screen"
    >
      <SurfaceCard style={styles.card}>
        <Text style={styles.kicker}>Agent access</Text>
        <FormField
          label="Email"
          testID="email-input"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="agent@example.com"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <FormField
          label="Password"
          testID="password-input"
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <ActionButton
          testID="sign-in-button"
          disabled={isPending}
          onPress={handleEmailSignIn}
          label="Sign in with email"
          icon="log-in"
        />

        <ActionButton
          testID="google-sign-in-button"
          disabled={isPending}
          onPress={handleGoogleSignIn}
          tone="secondary"
          label="Continue with Google"
          icon="chrome"
        />
      </SurfaceCard>
    </ScreenShell>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: 12
  },
  kicker: {
    color: mobileTheme.colors.brandStrong,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  error: {
    color: mobileTheme.colors.lost
  }
})
