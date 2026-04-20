import type { PropsWithChildren } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { mobileTheme } from "@showready/design-system"

export function ScreenShell({
  title,
  subtitle,
  children,
  scrollable = true,
  contentStyle,
  testID
}: PropsWithChildren<{
  title: string
  subtitle?: string
  scrollable?: boolean
  contentStyle?: StyleProp<ViewStyle>
  testID?: string
}>) {
  const content = (
    <>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>ShowReady agent</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </>
  )

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea} testID={testID}>
      <View style={styles.screen}>
        <View style={styles.glowPrimary} />
        <View style={styles.glowSecondary} />
        {scrollable ? (
          <ScrollView contentContainerStyle={[styles.content, contentStyle]}>
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
    paddingBottom: 40,
    gap: 18
  },
  hero: {
    gap: 8,
    marginBottom: 4
  },
  eyebrow: {
    color: mobileTheme.colors.accent,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontWeight: "700",
    fontSize: 11
  },
  title: {
    color: mobileTheme.colors.ink,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "700"
  },
  subtitle: {
    color: mobileTheme.colors.mutedInk,
    fontSize: 15,
    lineHeight: 22
  },
  body: {
    gap: 16
  },
  glowPrimary: {
    position: "absolute",
    top: -100,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(31,95,87,0.12)"
  },
  glowSecondary: {
    position: "absolute",
    right: -50,
    top: -60,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: "rgba(183,77,44,0.12)"
  }
})
