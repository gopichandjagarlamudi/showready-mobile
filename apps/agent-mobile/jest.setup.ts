jest.mock("@expo/vector-icons", () => {
  const React = require("react")
  const { Text } = require("react-native")

  function Icon(props: { name?: string }) {
    return React.createElement(Text, null, props.name ?? "icon")
  }

  return {
    Feather: Icon
  }
})

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: "ExponentPushToken[mock]" })),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn()
  }))
}))
