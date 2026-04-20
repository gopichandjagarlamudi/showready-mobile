import { StyleSheet, Text, View } from "react-native"
import { mobileTheme } from "@/lib/theme"

export function InlineMessage({
  title,
  message,
  tone = "warning"
}: {
  title: string
  message: string
  tone?: "success" | "warning" | "error"
}) {
  const palette =
    tone === "success"
      ? {
          backgroundColor: mobileTheme.colors.wonSoft,
          color: mobileTheme.colors.won
        }
      : tone === "error"
        ? {
            backgroundColor: mobileTheme.colors.lostSoft,
            color: mobileTheme.colors.lost
          }
        : {
            backgroundColor: mobileTheme.colors.nurtureSoft,
            color: mobileTheme.colors.nurture
          }

  return (
    <View style={[styles.container, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.title, { color: palette.color }]}>{title}</Text>
      <Text style={[styles.body, { color: palette.color }]}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 14,
    gap: 4
  },
  title: {
    fontSize: 13,
    fontWeight: "700"
  },
  body: {
    fontSize: 13,
    lineHeight: 19
  }
})
