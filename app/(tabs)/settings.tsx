import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  useColorScheme,
} from "react-native";
import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { getSyncStats, syncWithSupabase } from "@/services/sync";
import { cancelAllNotifications, getScheduledNotifications } from "@/services/notifications";

const colors = {
  light: {
    background: "#f5f5f5",
    cardBackground: "#ffffff",
    text: "#333",
    textSecondary: "#666",
    textTertiary: "#999",
    tint: "#007AFF",
    chevron: "#999",
  },
  dark: {
    background: "#000000",
    cardBackground: "#1c1c1e",
    text: "#ffffff",
    textSecondary: "#aaaaaa",
    textTertiary: "#777",
    tint: "#0A84FF",
    chevron: "#666",
  },
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const [syncStats, setSyncStats] = useState({
    pendingPets: 0,
    pendingVisits: 0,
    pendingFiles: 0,
    lastSyncAt: null as string | null,
  });
  const [scheduledNotifications, setScheduledNotifications] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadStats = useCallback(async () => {
    const stats = await getSyncStats();
    setSyncStats(stats);

    const notifications = await getScheduledNotifications();
    setScheduledNotifications(notifications.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncWithSupabase();
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const pushed = result.pushed.pets + result.pushed.visits + result.pushed.files;
        const pulled = result.pulled.pets + result.pulled.visits + result.pulled.files;
        Alert.alert(
          "Sync Complete",
          `Pushed ${pushed} and pulled ${pulled} records.`
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Sync Failed", result.error ?? "Unknown error");
      }
      loadStats();
    } catch {
      Alert.alert("Sync Failed", "Could not connect to Supabase");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearNotifications = () => {
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
            loadStats();
            Alert.alert("Done", "All notifications cleared");
          },
        },
      ]
    );
  };

  const totalPending = syncStats.pendingPets + syncStats.pendingVisits + syncStats.pendingFiles;
  const lastSyncLabel = syncStats.lastSyncAt
    ? new Date(syncStats.lastSyncAt).toLocaleString()
    : "Never";

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Sync Status</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons
                name={totalPending > 0 ? "cloud-upload-outline" : "checkmark-circle"}
                size={24}
                color={totalPending > 0 ? "#FF9500" : "#4CAF50"}
              />
              <Text style={[styles.statValue, { color: theme.text }]}>{totalPending}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={24} color={theme.tint} />
              <Text style={[styles.statValue, { color: theme.text, fontSize: 14 }]}>{lastSyncLabel}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Last Sync</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="notifications-outline" size={24} color={theme.tint} />
              <Text style={[styles.statValue, { color: theme.text }]}>{scheduledNotifications}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Reminders</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <Pressable
            style={[styles.button, { backgroundColor: theme.tint }, isSyncing && styles.buttonDisabled]}
            onPress={handleSync}
            disabled={isSyncing}
          >
            <Ionicons name="sync" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Notifications</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <Pressable style={styles.menuItem} onPress={handleClearNotifications}>
            <Ionicons name="notifications-off-outline" size={24} color="#FF3B30" />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Clear All Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.chevron} />
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>About</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: theme.textSecondary }]}>Version</Text>
            <Text style={[styles.aboutValue, { color: theme.text }]}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: theme.textSecondary }]}>Data Storage</Text>
            <Text style={[styles.aboutValue, { color: theme.text }]}>Local + Supabase</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 12,
    padding: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  aboutLabel: {
    fontSize: 16,
  },
  aboutValue: {
    fontSize: 16,
  },
});
