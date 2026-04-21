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
      <View style={styles.body}>{children}</View>
    </>
  )

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea} testID={testID}>
      <View style={styles.screen}>
        <View style={styles.glowPrimary} pointerEvents="none" />
        <View style={styles.glowSecondary} pointerEvents="none" />
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
    paddingTop: 18,
    paddingBottom: 132,
    gap: 24
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: mobileTheme.colors.surfaceTint,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border
  },
  eyebrow: {
    color: mobileTheme.colors.brandStrong,
    letterSpacing: 0.8,
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
    lineHeight: 38,
    fontWeight: "700"
  },
  subtitle: {
    color: mobileTheme.colors.mutedInk,
    fontSize: mobileTheme.typography.body,
    lineHeight: 24,
    maxWidth: 560
  },
  body: {
    gap: 16
  },
  glowPrimary: {
    position: "absolute",
    top: -80,
    left: -54,
    width: 210,
    height: 210,
    borderRadius: 999,
    backgroundColor: "rgba(37, 99, 235, 0.10)"
  },
  glowSecondary: {
    position: "absolute",
    right: -48,
    top: 40,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(249, 115, 22, 0.10)"
  }
})
