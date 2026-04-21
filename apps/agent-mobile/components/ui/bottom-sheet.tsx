import type { PropsWithChildren } from "react"
import { Modal, Pressable, StyleSheet, Text, View } from "react-native"
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
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <View style={styles.content}>{children}</View>
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
    ...mobileTheme.elevation.floating
  },
  handle: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: mobileTheme.colors.borderStrong
  },
  header: {
    gap: 4
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
  content: {
    gap: 12
  }
})
