import type { PropsWithChildren } from "react"
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { Feather } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import { mobileTheme } from "@/lib/theme"

export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  testID
}: PropsWithChildren<{
  visible: boolean
  onClose: () => void
  title: string
  subtitle?: string
  testID?: string
}>) {
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} testID={testID ? `${testID}-backdrop` : undefined} />
        <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
          <View style={styles.sheet} testID={testID}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Close ${title}`}
                onPress={onClose}
                style={({ pressed }) => [styles.closeButton, pressed ? styles.closeButtonPressed : null]}
                testID={testID ? `${testID}-close` : undefined}
              >
                <Feather name="x" size={18} color={mobileTheme.colors.ink} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {children}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: mobileTheme.colors.scrim
  },
  backdrop: {
    flex: 1
  },
  safeArea: {
    justifyContent: "flex-end"
  },
  sheet: {
    borderTopLeftRadius: mobileTheme.radii.sheet,
    borderTopRightRadius: mobileTheme.radii.sheet,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    maxHeight: "88%",
    ...mobileTheme.elevation.floating
  },
  handle: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: mobileTheme.colors.borderStrong
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  header: {
    gap: 4,
    flex: 1
  },
  title: {
    fontSize: mobileTheme.typography.section,
    lineHeight: 28,
    fontWeight: "700",
    color: mobileTheme.colors.ink
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: mobileTheme.colors.mutedInk
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: mobileTheme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border
  },
  closeButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }]
  },
  content: {
    gap: 12
  }
})
