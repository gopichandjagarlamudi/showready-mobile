import { StyleSheet, Text, View } from "react-native"
import type { LeadStage, Recommendation } from "@showready/contracts"
import { getStagePresentation } from "@/lib/stage-presentation"

export function StageChip({
  stage,
  recommendation
}: {
  stage?: LeadStage
  recommendation?: Recommendation
}) {
  const presentation = getStagePresentation(stage, recommendation)

  return (
    <View style={[styles.chip, { backgroundColor: presentation.backgroundColor }]}>
      <Text style={[styles.label, { color: presentation.color }]}>{presentation.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  label: {
    fontSize: 12,
    fontWeight: "700"
  }
})
