import { useState, useTransition } from "react"
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { mobileTheme } from "@showready/design-system"
import { ScreenShell } from "../../components/screen-shell"
import { signInWithGoogle } from "../../lib/auth-oauth"
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
        setError(signInError.message)
      }
    })
  }

  function handleGoogleSignIn() {
    setError(null)
    startTransition(async () => {
      const result = await signInWithGoogle()

      if (result.type === "error") {
        setError(result.message)
      }
    })
  }

  return (
    <ScreenShell
      title="Sign in"
      subtitle="Access your mobile command center with the same ShowReady backend contract."
      testID="sign-in-screen"
    >
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          testID="email-input"
          accessibilityLabel="Email input"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="agent@example.com"
          placeholderTextColor={mobileTheme.colors.mutedInk}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          testID="password-input"
          accessibilityLabel="Password input"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={mobileTheme.colors.mutedInk}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity
          testID="sign-in-button"
          disabled={isPending}
          style={styles.primaryButton}
          onPress={handleEmailSignIn}
        >
          <Text style={styles.primaryButtonLabel}>Sign in with email</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="google-sign-in-button"
          disabled={isPending}
          style={styles.secondaryButton}
          onPress={handleGoogleSignIn}
        >
          <Text style={styles.secondaryButtonLabel}>Continue with Google</Text>
        </TouchableOpacity>
      </View>
    </ScreenShell>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    padding: 20,
    gap: 12
  },
  label: {
    color: mobileTheme.colors.mutedInk,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: mobileTheme.colors.ink
  },
  error: {
    color: mobileTheme.colors.accent
  },
  primaryButton: {
    borderRadius: 999,
    backgroundColor: mobileTheme.colors.brand,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4
  },
  primaryButtonLabel: {
    color: "white",
    fontWeight: "700"
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "white"
  },
  secondaryButtonLabel: {
    color: mobileTheme.colors.ink,
    fontWeight: "700"
  }
})
