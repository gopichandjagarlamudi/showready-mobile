import { Tabs } from "expo-router"
import { mobileTheme } from "@showready/design-system"

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: mobileTheme.colors.surface,
          borderTopColor: mobileTheme.colors.border
        },
        tabBarActiveTintColor: mobileTheme.colors.brand,
        tabBarInactiveTintColor: mobileTheme.colors.mutedInk
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="new-leads" options={{ title: "New Leads" }} />
      <Tabs.Screen name="pipeline" options={{ title: "Pipeline" }} />
      <Tabs.Screen name="appointments" options={{ title: "Appointments" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  )
}
