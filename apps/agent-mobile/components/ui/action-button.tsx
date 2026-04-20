import { Pressable, StyleSheet, Text } from "react-native"
import { mobileTheme } from "@/lib/theme"

export function ActionButton({
  label,
  onPress,
  disabled = false,
  tone = "primary",
  testID
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  tone?: "primary" | "secondary" | "danger"
  testID?: string
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        tone === "primary"
          ? styles.primary
          : tone === "danger"
            ? styles.danger
            : styles.secondary,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null
      ]}
    >
      <Text
        style={[
          styles.label,
          tone === "primary"
            ? styles.primaryLabel
            : tone === "danger"
              ? styles.dangerLabel
              : styles.secondaryLabel
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: mobileTheme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  primary: {
    backgroundColor: mobileTheme.colors.brand
  },
  secondary: {
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border
  },
  danger: {
    backgroundColor: mobileTheme.colors.lostSoft,
    borderWidth: 1,
    borderColor: mobileTheme.colors.lostSoft
  },
  label: {
    fontSize: 14,
    fontWeight: "700"
  },
  primaryLabel: {
    color: "white"
  },
  secondaryLabel: {
    color: mobileTheme.colors.ink
  },
  dangerLabel: {
    color: mobileTheme.colors.lost
  },
  pressed: {
    opacity: 0.92
  },
  disabled: {
    opacity: 0.55
  }
})
