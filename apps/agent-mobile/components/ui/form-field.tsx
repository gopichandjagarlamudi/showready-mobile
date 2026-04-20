import { StyleSheet, Text, TextInput, View } from "react-native"
import { mobileTheme } from "@/lib/theme"

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  autoCapitalize = "sentences",
  autoCorrect = true,
  keyboardType,
  testID
}: {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  error?: string
  multiline?: boolean
  autoCapitalize?: "none" | "sentences" | "words" | "characters"
  autoCorrect?: boolean
  keyboardType?: "default" | "email-address" | "numeric" | "number-pad" | "decimal-pad" | "phone-pad"
  testID?: string
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={mobileTheme.colors.mutedInk}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        style={[styles.input, multiline ? styles.multiline : null, error ? styles.inputError : null]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  field: {
    gap: 8
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: mobileTheme.colors.mutedInk
  },
  input: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: mobileTheme.colors.ink
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: "top"
  },
  inputError: {
    borderColor: mobileTheme.colors.lost
  },
  error: {
    color: mobileTheme.colors.lost,
    fontSize: 12
  }
})
