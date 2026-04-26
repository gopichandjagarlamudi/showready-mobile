import { fireEvent, render, waitFor } from "@testing-library/react-native"
import SignInScreen from "../app/(auth)/sign-in"

jest.mock("../lib/auth-oauth", () => ({
  signInWithGoogle: jest.fn(async () => ({ type: "success" }))
}))

jest.mock("../lib/auth-apple", () => ({
  isAppleSignInAvailable: jest.fn(async () => true),
  signInWithApple: jest.fn(async () => ({ type: "success" }))
}))

jest.mock("../lib/diagnostics/service", () => ({
  captureDiagnosticsError: jest.fn(async () => undefined)
}))

jest.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(async () => ({ error: null }))
    }
  }
}))

jest.mock("expo-apple-authentication", () => {
  const React = require("react")
  const { Pressable, Text } = require("react-native")

  function AppleAuthenticationButton(props: {
    onPress?: () => void
    testID?: string
  }) {
    return React.createElement(
      Pressable,
      {
        onPress: props.onPress,
        testID: props.testID,
        accessibilityRole: "button"
      },
      React.createElement(Text, null, "Continue with Apple")
    )
  }

  return {
    __esModule: true,
    AppleAuthenticationButton,
    AppleAuthenticationButtonStyle: {
      BLACK: "BLACK"
    },
    AppleAuthenticationButtonType: {
      CONTINUE: "CONTINUE"
    }
  }
})

const { isAppleSignInAvailable, signInWithApple } = jest.requireMock("../lib/auth-apple") as {
  isAppleSignInAvailable: jest.Mock
  signInWithApple: jest.Mock
}

const { captureDiagnosticsError } = jest.requireMock("../lib/diagnostics/service") as {
  captureDiagnosticsError: jest.Mock
}

describe("SignInScreen", () => {
  beforeEach(() => {
    isAppleSignInAvailable.mockReset()
    signInWithApple.mockReset()
    captureDiagnosticsError.mockReset()

    isAppleSignInAvailable.mockResolvedValue(true)
    signInWithApple.mockResolvedValue({ type: "success" })
  })

  it("renders the Apple sign-in button on supported iOS builds", async () => {
    const screen = render(<SignInScreen />)

    expect(await screen.findByTestId("apple-sign-in-button")).toBeTruthy()
    expect(
      screen.queryByText(
        "Access the field dashboard with the same ShowReady account and keep authentication simple on mobile."
      )
    ).toBeNull()
    expect(isAppleSignInAvailable).toHaveBeenCalledTimes(1)
  })

  it("hides the Apple sign-in button on unsupported builds", async () => {
    isAppleSignInAvailable.mockResolvedValue(false)

    const screen = render(<SignInScreen />)

    await waitFor(() => {
      expect(screen.queryByTestId("apple-sign-in-button")).toBeNull()
    })
    expect(isAppleSignInAvailable).toHaveBeenCalledTimes(1)
  })

  it("starts Apple sign-in when the Apple button is pressed", async () => {
    const screen = render(<SignInScreen />)

    fireEvent.press(await screen.findByTestId("apple-sign-in-button"))

    await waitFor(() => {
      expect(signInWithApple).toHaveBeenCalledTimes(1)
    })
  })

  it("shows inline feedback when Apple sign-in fails", async () => {
    signInWithApple.mockResolvedValue({
      type: "error",
      message: "Apple sign-in failed."
    })

    const screen = render(<SignInScreen />)

    fireEvent.press(await screen.findByTestId("apple-sign-in-button"))

    expect(await screen.findByText("Apple sign-in failed.")).toBeTruthy()
    expect(captureDiagnosticsError).toHaveBeenCalledWith(new Error("Apple sign-in failed."), {
      eventType: "auth.event",
      category: "auth",
      severity: "error",
      context: {
        method: "apple"
      }
    })
  })

  it("does not show an error when the Apple flow is cancelled", async () => {
    signInWithApple.mockResolvedValue({
      type: "cancel"
    })

    const screen = render(<SignInScreen />)

    fireEvent.press(await screen.findByTestId("apple-sign-in-button"))

    await waitFor(() => {
      expect(signInWithApple).toHaveBeenCalledTimes(1)
    })
    expect(screen.queryByText("Apple sign-in failed.")).toBeNull()
  })
})
