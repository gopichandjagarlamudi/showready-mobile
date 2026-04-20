import { fireEvent, render } from "@testing-library/react-native"
import { FormField } from "./form-field"

describe("FormField", () => {
  it("forwards testID to the text input", () => {
    const onChangeText = jest.fn()
    const screen = render(
      <FormField
        label="Brokerage"
        value=""
        onChangeText={onChangeText}
        testID="settings-brokerage-input"
      />
    )

    fireEvent.changeText(screen.getByTestId("settings-brokerage-input"), "Northline Realty")

    expect(onChangeText).toHaveBeenCalledWith("Northline Realty")
  })
})
