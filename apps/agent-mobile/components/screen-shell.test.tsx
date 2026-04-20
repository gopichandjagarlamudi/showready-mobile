import { render } from "@testing-library/react-native"
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
})
