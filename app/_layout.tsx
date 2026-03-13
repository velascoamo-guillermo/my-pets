import "@/polyfills";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DatabaseProvider } from "@/db";
import { NetworkProvider } from "@/hooks/useNetworkStatus";
import { useNotificationSetup } from "@/hooks/useNotifications";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { queryClient } from "@/lib/queryClient";
import { supabase } from "@/services/supabase";
import { syncWithSupabase } from "@/services/sync";
import { Ionicons } from "@expo/vector-icons";
import * as Sentry from "@sentry/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import * as Linking from "expo-linking";
import { Link, Stack, router } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, Pressable, StyleSheet, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

Sentry.init({
  dsn: "https://8ee0c7dea63d7ee74bda1986f098ede7@o4510851483369472.ingest.de.sentry.io/4510851488809040",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

const colors = {
  light: {
    background: "#FFF0F5",
    text: "#000000",
    tint: "#D4517A",
    headerBackground: "#FFF0F5",
  },
  dark: {
    background: "#1a0d12",
    text: "#ffffff",
    tint: "#F07098",
    headerBackground: "#2a1520",
  },
};

function AppContent() {
  useNotificationSetup();
  useRealtimeSync();
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const appState = useRef(AppState.currentState);
  const { user, isLoading } = useAuth();

  // Navigation guard: redirect based on auth state
  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(auth)");
    }
  }, [user, isLoading]);

  // Handle OAuth deep link redirect (Google sign-in callback)
  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      supabase.auth.exchangeCodeForSession(url).catch((err) => {
        Sentry.captureException(err);
      });
    });
    return () => sub.remove();
  }, []);

  // Sync with Supabase on foreground — only when authenticated
  useEffect(() => {
    if (!user) return;

    const sub = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        syncWithSupabase().catch((err) => Sentry.captureException(err));
      }
      appState.current = nextState;
    });

    syncWithSupabase().catch((err) => Sentry.captureException(err));

    return () => sub.remove();
  }, [user]);

  return (
    <>
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.headerBackground },
          headerTintColor: theme.text,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen
          name="(auth)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerTitle: "My Pets",
            presentation: "modal",
            headerRight: () => (
              <Link href="/pets/new" asChild>
                <Pressable testID="add-pet-button" style={styles.headerButton}>
                  <Ionicons name="add" size={28} color={theme.tint} />
                </Pressable>
              </Link>
            ),
          }}
        />
        <Stack.Screen
          name="pdf-viewer/[id]"
          options={{
            presentation: "modal",
            headerTitle: "PDF",
          }}
        />
        <Stack.Screen
          name="analyzing/[id]"
          options={{
            presentation: "formSheet",
            headerShown: false,
            sheetGrabberVisible: true,
            sheetAllowedDetents: "fitToContents",
            ...(isLiquidGlassAvailable() && {
              contentStyle: { backgroundColor: "transparent" },
            }),
          }}
        />
      </Stack>
    </>
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

export default Sentry.wrap(function RootLayout() {
  return (
    <DatabaseProvider>
      <QueryClientProvider client={queryClient}>
        <NetworkProvider>
          <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <AppContent />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AuthProvider>
        </NetworkProvider>
      </QueryClientProvider>
    </DatabaseProvider>
  );
});
