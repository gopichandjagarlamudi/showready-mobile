import { render } from "@testing-library/react-native"
import { ScrollView, StyleSheet, Text } from "react-native"
import { BottomSheet } from "./bottom-sheet"

describe("BottomSheet", () => {
  it("dismisses when the sheet is swiped down", () => {
    const onClose = jest.fn()
    const screen = render(
      <BottomSheet visible title="Actions" onClose={onClose} testID="demo-sheet">
        <Text>Sheet content</Text>
      </BottomSheet>
    )

    const sheet = screen.getByTestId("demo-sheet")

    sheet.props.onTouchStart({ nativeEvent: { pageY: 100 } })
    expect(sheet.props.onMoveShouldSetResponder({ nativeEvent: { pageY: 120 } })).toBe(true)
    sheet.props.onResponderMove({ nativeEvent: { pageY: 192 } })
    sheet.props.onResponderRelease({ nativeEvent: { pageY: 192 } })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("keeps compact sheet actions clear of the bottom edge", () => {
    const screen = render(
      <BottomSheet visible title="Actions" onClose={jest.fn()} testID="demo-sheet">
        <Text>Sheet content</Text>
      </BottomSheet>
    )

    const sheetStyle = StyleSheet.flatten(screen.getByTestId("demo-sheet").props.style)
    const contentStyle = StyleSheet.flatten(screen.UNSAFE_getByType(ScrollView).props.contentContainerStyle)

    expect(sheetStyle.minHeight).toBeGreaterThanOrEqual(280)
    expect(sheetStyle.paddingBottom).toBeGreaterThanOrEqual(28)
    expect(contentStyle.paddingBottom).toBeGreaterThanOrEqual(12)
  })
})
