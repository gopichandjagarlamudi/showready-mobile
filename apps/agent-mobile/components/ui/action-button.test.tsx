import { StyleSheet } from "react-native"
import { fireEvent, render } from "@testing-library/react-native"
import { ActionButton } from "./action-button"

describe("ActionButton", () => {
  it("forwards testID to the pressable button", () => {
    const onPress = jest.fn()
    const screen = render(
      <ActionButton
        label="Create invite"
        onPress={onPress}
        testID="invite-button"
      />
    )

    fireEvent.press(screen.getByTestId("invite-button"))

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it("uses the ShowReady green token for primary actions", () => {
    const screen = render(
      <ActionButton
        label="Create invite"
        onPress={jest.fn()}
        testID="invite-button"
      />
    )

    const rawStyle = screen.getByTestId("invite-button").props.style
    const style = StyleSheet.flatten(
      typeof rawStyle === "function" ? rawStyle({ pressed: false }) : rawStyle
    )

    expect(style.backgroundColor).toBe("#24533f")
  })
})
