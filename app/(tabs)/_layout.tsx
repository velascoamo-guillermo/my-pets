import { Icon, NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index" options={{ title: "My Pets" }}>
        <Icon sf={{ default: "pawprint", selected: "pawprint.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings" options={{ title: "Settings" }}>
        <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
