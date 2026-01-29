import { DatabaseProvider } from "@/db";
import { useNotificationSetup } from "@/hooks/useNotifications";
import { Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { Pressable, StyleSheet, useColorScheme } from "react-native";

const colors = {
  light: {
    background: "#ffffff",
    text: "#000000",
    tint: "#007AFF",
    headerBackground: "#f8f8f8",
  },
  dark: {
    background: "#000000",
    text: "#ffffff",
    tint: "#0A84FF",
    headerBackground: "#1c1c1e",
  },
};

function AppContent() {
  useNotificationSetup();
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.headerBackground },
        headerTintColor: theme.text,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerTitle: "My Pets",
          presentation: "modal",
          headerRight: () => (
            <Link href="/pets/new" asChild>
              <Pressable style={styles.headerButton}>
                <Ionicons name="add" size={28} color={theme.tint} />
              </Pressable>
            </Link>
          ),
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <AppContent />
    </DatabaseProvider>
  );
}
