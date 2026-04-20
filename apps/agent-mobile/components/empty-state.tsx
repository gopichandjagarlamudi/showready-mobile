import { StyleSheet, Text, View } from "react-native"
import { mobileTheme } from "@showready/design-system"

export function EmptyState({
  title,
  body
}: {
  title: string
  body: string
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderStyle: "dashed",
    borderRadius: 24,
    padding: 20,
    backgroundColor: mobileTheme.colors.surface
  },
  title: {
    color: mobileTheme.colors.ink,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6
  },
  body: {
    color: mobileTheme.colors.mutedInk,
    lineHeight: 21
  }
})
