import { fireEvent, render } from "@testing-library/react-native"
import { ScreenShell } from "./screen-shell"

describe("ScreenShell", () => {
  it("renders title and subtitle", () => {
    const screen = render(
      <ScreenShell title="Dashboard" subtitle="Overview">
        <></>
      </ScreenShell>
    )

    expect(screen.getByText("Dashboard")).toBeTruthy()
    expect(screen.getByText("Overview")).toBeTruthy()
  })

  it("renders a contextual header action", () => {
    const onPress = jest.fn()
    const screen = render(
      <ScreenShell
        title="Dashboard"
        subtitle="Overview"
        headerAction={{
          icon: "settings",
          label: "Open settings",
          onPress,
          testID: "shell-header-action"
        }}
      >
        <></>
      </ScreenShell>
    )

    fireEvent.press(screen.getByTestId("shell-header-action"))

    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
