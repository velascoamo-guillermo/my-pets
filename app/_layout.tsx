import { Stack } from "expo-router";
import { DatabaseProvider } from "@/db";
import { useNotificationSetup } from "@/hooks/useNotifications";

function AppContent() {
  useNotificationSetup();
  return <Stack />;
}

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <AppContent />
    </DatabaseProvider>
  );
}
