import { DatabaseProvider } from "@/db";
import { useNotificationSetup } from "@/hooks/useNotifications";
import { queryClient } from "@/lib/queryClient";
import { syncWithSupabase } from "@/services/sync";
import { QueryClientProvider } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, Pressable, StyleSheet, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        syncWithSupabase().catch(() => {});
      }
      appState.current = nextState;
    });
    // Also sync on initial mount
    syncWithSupabase().catch(() => {});
    return () => sub.remove();
  }, []);

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
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppContent />
        </GestureHandlerRootView>
      </QueryClientProvider>
    </DatabaseProvider>
  );
}
