import { useCallback, useState } from "react";
import { Alert } from "react-native";
import * as Sentry from "@sentry/react-native";
import * as Haptics from "expo-haptics";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSyncStats, syncWithSupabase } from "@/services/sync";
import {
  cancelAllNotifications,
  getScheduledNotifications,
} from "@/services/notifications";
import { queryKeys } from "@/lib/queryKeys";

export function useSettingsScreen() {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: syncStats } = useQuery({
    queryKey: queryKeys.syncStats,
    queryFn: async () => {
      const stats = await getSyncStats();
      const notifications = await getScheduledNotifications();
      return {
        ...stats,
        scheduledNotifications: notifications.length,
      };
    },
  });

  const totalPending =
    (syncStats?.pendingPets ?? 0) +
    (syncStats?.pendingVisits ?? 0) +
    (syncStats?.pendingFiles ?? 0);

  const lastSyncLabel = syncStats?.lastSyncAt
    ? new Date(syncStats.lastSyncAt).toLocaleString()
    : "Never";

  const scheduledNotifications = syncStats?.scheduledNotifications ?? 0;

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await syncWithSupabase();
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const pushed =
          result.pushed.pets + result.pushed.visits + result.pushed.files;
        const pulled =
          result.pulled.pets + result.pulled.visits + result.pulled.files;
        Alert.alert(
          "Sync Complete",
          `Pushed ${pushed} and pulled ${pulled} records.`,
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Sync Failed", result.error ?? "Unknown error");
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.syncStats });
    } catch (err) {
      Sentry.captureException(err);
      Alert.alert("Sync Failed", "Could not connect to Supabase");
    } finally {
      setIsSyncing(false);
    }
  }, [queryClient]);

  const handleClearNotifications = useCallback(() => {
    Alert.alert(
      "Clear Notifications",
      "Are you sure you want to cancel all scheduled notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await cancelAllNotifications();
            queryClient.invalidateQueries({ queryKey: queryKeys.syncStats });
            Alert.alert("Done", "All notifications cleared");
          },
        },
      ],
    );
  }, [queryClient]);

  return {
    totalPending,
    lastSyncLabel,
    scheduledNotifications,
    isSyncing,
    handleSync,
    handleClearNotifications,
  };
}
