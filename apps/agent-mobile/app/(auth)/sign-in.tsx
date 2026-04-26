import { useEffect, useState, useTransition } from "react"
import { StyleSheet, Text } from "react-native"
import * as AppleAuthentication from "expo-apple-authentication"
import { mobileTheme } from "@showready/design-system"
import { ActionButton } from "../../components/ui/action-button"
import { FormField } from "../../components/ui/form-field"
import { SurfaceCard } from "../../components/ui/surface-card"
import { ScreenShell } from "../../components/screen-shell"
import { isAppleSignInAvailable, signInWithApple } from "../../lib/auth-apple"
import { signInWithGoogle } from "../../lib/auth-oauth"
import { captureDiagnosticsError } from "../../lib/diagnostics/service"
import { supabase } from "../../lib/supabase"

export default function SignInScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let isMounted = true

    isAppleSignInAvailable()
      .then((isAvailable) => {
        if (!isMounted) {
          return
        }

        setAppleSignInAvailable(isAvailable)
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        setAppleSignInAvailable(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

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

  function handleAppleSignIn() {
    if (isPending) {
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await signInWithApple()

      if (result.type === "error") {
        void captureDiagnosticsError(new Error(result.message), {
          eventType: "auth.event",
          category: "auth",
          severity: "error",
          context: {
            method: "apple"
          }
        })
        setError(result.message)
      }
    })
  }

  return (
    <ScreenShell
      title="Sign in"
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

        {appleSignInAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            testID="apple-sign-in-button"
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={24}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        ) : null}
      </SurfaceCard>
    </ScreenShell>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: 14
  },
  appleButton: {
    width: "100%",
    height: 48
  },
  kicker: {
    color: mobileTheme.colors.brandStrong,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0
  },
  error: {
    color: mobileTheme.colors.lost,
    fontSize: 13,
    lineHeight: 18
  }
})
