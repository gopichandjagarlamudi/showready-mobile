import { StyleSheet, Text, View } from "react-native"
import { mobileTheme } from "@showready/design-system"
import { ActionButton } from "./ui/action-button"

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  variant = "default",
  eyebrow
}: {
  title: string
  body: string
  actionLabel?: string
  onAction?: () => void
  variant?: "default" | "guided"
  eyebrow?: string
}) {
  return (
    <View style={[styles.container, variant === "guided" ? styles.guidedContainer : null]}>
      {variant === "guided" ? <View style={styles.guidedBadge} /> : null}
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction ? (
        <ActionButton
          label={actionLabel}
          onPress={onAction}
          tone={variant === "guided" ? "primary" : "secondary"}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: 24,
    padding: 20,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    gap: 8
  },
  guidedContainer: {
    backgroundColor: mobileTheme.colors.surfaceTint,
    borderColor: mobileTheme.colors.borderStrong,
    gap: 10
  },
  guidedBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: mobileTheme.colors.brand,
    opacity: 0.12
  },
  eyebrow: {
    color: mobileTheme.colors.brandStrong,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  title: {
    color: mobileTheme.colors.ink,
    fontSize: 18,
    fontWeight: "700"
  },
  body: {
    color: mobileTheme.colors.mutedInk,
    lineHeight: 21
  }
})
