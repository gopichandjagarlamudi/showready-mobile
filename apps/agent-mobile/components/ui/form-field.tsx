import { StyleSheet, Text, TextInput, View } from "react-native"
import { mobileTheme } from "@/lib/theme"

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  multiline = false,
  autoCapitalize = "sentences",
  autoCorrect = true,
  keyboardType,
  secureTextEntry = false,
  textContentType,
  autoComplete,
  testID
}: {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  error?: string
  helperText?: string
  multiline?: boolean
  autoCapitalize?: "none" | "sentences" | "words" | "characters"
  autoCorrect?: boolean
  keyboardType?: "default" | "email-address" | "numeric" | "number-pad" | "decimal-pad" | "phone-pad"
  secureTextEntry?: boolean
  textContentType?:
    | "none"
    | "name"
    | "emailAddress"
    | "telephoneNumber"
    | "password"
    | "organizationName"
    | "username"
  autoComplete?:
    | "off"
    | "name"
    | "email"
    | "tel"
    | "street-address"
    | "username"
    | "password"
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
        secureTextEntry={secureTextEntry}
        textContentType={textContentType}
        autoComplete={autoComplete}
        style={[styles.input, multiline ? styles.multiline : null, error ? styles.inputError : null]}
      />
      {helperText && !error ? <Text style={styles.helper}>{helperText}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  field: {
    gap: 8
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0,
    color: mobileTheme.colors.brandStrong
  },
  input: {
    minHeight: 52,
    borderRadius: mobileTheme.radii.control,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: mobileTheme.colors.ink,
    fontSize: mobileTheme.typography.body
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: "top"
  },
  helper: {
    color: mobileTheme.colors.subtleInk,
    fontSize: mobileTheme.typography.bodySmall,
    lineHeight: 21
  },
  inputError: {
    borderColor: mobileTheme.colors.lost
  },
  error: {
    color: mobileTheme.colors.lost,
    fontSize: mobileTheme.typography.bodySmall,
    lineHeight: 21
  }
})
