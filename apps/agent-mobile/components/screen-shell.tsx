import type { PropsWithChildren } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { Feather } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import { mobileTheme } from "@showready/design-system"

export function ScreenShell({
  title,
  subtitle,
  children,
  scrollable = true,
  contentStyle,
  testID,
  eyebrow = "ShowReady mobile",
  headerAction
}: PropsWithChildren<{
  title: string
  subtitle?: string
  scrollable?: boolean
  contentStyle?: StyleProp<ViewStyle>
  testID?: string
  eyebrow?: string
  headerAction?: {
    icon: keyof typeof Feather.glyphMap
    label: string
    onPress: () => void
    testID?: string
  }
}>) {
  const content = (
    <>
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.eyebrowPill}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
          </View>
          {headerAction ? (
            <Pressable
              testID={headerAction.testID}
              accessibilityRole="button"
              accessibilityLabel={headerAction.label}
              onPress={headerAction.onPress}
              style={({ pressed }) => [
                styles.headerAction,
                pressed ? styles.headerActionPressed : null
              ]}
            >
              <Feather name={headerAction.icon} size={18} color={mobileTheme.colors.ink} />
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.body, !scrollable ? styles.bodyStatic : null]}>{children}</View>
    </>
  )

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea} testID={testID}>
      <View style={styles.screen}>
        {scrollable ? (
          <ScrollView
            contentContainerStyle={[styles.content, contentStyle]}
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          <View style={[styles.content, contentStyle]}>{content}</View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: mobileTheme.colors.background
  },
  screen: {
    flex: 1,
    backgroundColor: mobileTheme.colors.background
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 132,
    gap: 22
  },
  hero: {
    gap: 10
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  eyebrowPill: {
    borderRadius: mobileTheme.radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: mobileTheme.colors.surfaceTint,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderStrong
  },
  eyebrow: {
    color: mobileTheme.colors.brandStrong,
    letterSpacing: 0,
    textTransform: "uppercase",
    fontWeight: "700",
    fontSize: mobileTheme.typography.eyebrow
  },
  headerAction: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: mobileTheme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    ...mobileTheme.elevation.card
  },
  headerActionPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }]
  },
  title: {
    color: mobileTheme.colors.ink,
    fontSize: mobileTheme.typography.title,
    lineHeight: 40,
    fontWeight: "800"
  },
  subtitle: {
    color: mobileTheme.colors.mutedInk,
    fontSize: mobileTheme.typography.bodySmall,
    lineHeight: 21,
    maxWidth: 560
  },
  body: {
    gap: 16
  },
  bodyStatic: {
    flex: 1
  }
})
