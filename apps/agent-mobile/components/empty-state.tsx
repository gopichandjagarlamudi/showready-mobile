import { StyleSheet, Text, View } from "react-native"
import { Feather } from "@expo/vector-icons"
import { mobileTheme } from "@showready/design-system"
import { ActionButton } from "./ui/action-button"

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  actionTestID,
  variant = "default",
  eyebrow,
  icon = "inbox"
}: {
  title: string
  body: string
  actionLabel?: string
  onAction?: () => void
  actionTestID?: string
  variant?: "default" | "guided"
  eyebrow?: string
  icon?: keyof typeof Feather.glyphMap
}) {
  return (
    <View style={[styles.container, variant === "guided" ? styles.guidedContainer : null]}>
      {variant === "guided" ? (
        <View style={styles.guidedBadge}>
          <Feather name={icon} size={26} color={mobileTheme.colors.brand} />
        </View>
      ) : null}
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction ? (
        <ActionButton
          label={actionLabel}
          onPress={onAction}
          tone={variant === "guided" ? "primary" : "secondary"}
          testID={actionTestID}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radii.card,
    padding: 22,
    backgroundColor: mobileTheme.colors.surface,
    gap: 8
  },
  guidedContainer: {
    borderColor: mobileTheme.colors.border,
    gap: 12,
    ...mobileTheme.elevation.card
  },
  guidedBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.surfaceTint
  },
  eyebrow: {
    color: mobileTheme.colors.brandStrong,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0
  },
  title: {
    color: mobileTheme.colors.ink,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800"
  },
  body: {
    color: mobileTheme.colors.mutedInk,
    fontSize: mobileTheme.typography.body,
    lineHeight: 25
  }
})
