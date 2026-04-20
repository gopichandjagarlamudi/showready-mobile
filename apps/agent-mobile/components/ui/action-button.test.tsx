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
})
