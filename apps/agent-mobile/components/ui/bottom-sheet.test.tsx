import { render } from "@testing-library/react-native"
import { Text } from "react-native"
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
})
