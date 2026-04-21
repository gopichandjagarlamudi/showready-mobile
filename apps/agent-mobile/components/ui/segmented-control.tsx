import { Pressable, StyleSheet, Text, View } from "react-native"
import { mobileTheme } from "@/lib/theme"

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  testIDPrefix
}: {
  value: T
  options: Array<{ label: string; value: T }>
  onChange: (value: T) => void
  testIDPrefix?: string
}) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isSelected = option.value === value

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(option.value)}
            testID={testIDPrefix ? `${testIDPrefix}-${option.value}` : undefined}
            style={({ pressed }) => [
              styles.option,
              isSelected ? styles.optionSelected : null,
              pressed ? styles.optionPressed : null
            ]}
          >
            <Text style={[styles.label, isSelected ? styles.labelSelected : null]}>
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    padding: 6,
    borderRadius: mobileTheme.radii.card,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surfaceMuted
  },
  option: {
    flex: 1,
    minHeight: 44,
    borderRadius: mobileTheme.radii.control,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  optionSelected: {
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderStrong
  },
  optionPressed: {
    opacity: 0.88
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: mobileTheme.colors.mutedInk,
    textAlign: "center"
  },
  labelSelected: {
    color: mobileTheme.colors.ink
  }
})
