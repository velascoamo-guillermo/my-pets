import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getSyncStats, syncWithServer } from "@/services/sync";
import { cancelAllNotifications, getScheduledNotifications } from "@/services/notifications";

export default function SettingsScreen() {
  const [apiUrl, setApiUrl] = useState("");
  const [syncStats, setSyncStats] = useState({
    pendingPets: 0,
    pendingVisits: 0,
    conflictPets: 0,
    conflictVisits: 0,
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
    if (!apiUrl) {
      Alert.alert("Error", "Please enter an API URL first");
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncWithServer(apiUrl);
      if (result.success) {
        Alert.alert(
          "Sync Complete",
          `Synced ${result.syncedPets} pets and ${result.syncedVisits} visits.${
            result.conflicts > 0 ? ` ${result.conflicts} conflicts found.` : ""
          }`
        );
      } else {
        Alert.alert("Sync Failed", result.error ?? "Unknown error");
      }
      loadStats();
    } catch {
      Alert.alert("Sync Failed", "Could not connect to server");
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

  const totalPending = syncStats.pendingPets + syncStats.pendingVisits;
  const totalConflicts = syncStats.conflictPets + syncStats.conflictVisits;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Status</Text>
        <View style={styles.card}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons
                name={totalPending > 0 ? "cloud-upload-outline" : "checkmark-circle"}
                size={24}
                color={totalPending > 0 ? "#FF9500" : "#4CAF50"}
              />
              <Text style={styles.statValue}>{totalPending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons
                name={totalConflicts > 0 ? "warning" : "checkmark-circle"}
                size={24}
                color={totalConflicts > 0 ? "#FF3B30" : "#4CAF50"}
              />
              <Text style={styles.statValue}>{totalConflicts}</Text>
              <Text style={styles.statLabel}>Conflicts</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="notifications-outline" size={24} color="#007AFF" />
              <Text style={styles.statValue}>{scheduledNotifications}</Text>
              <Text style={styles.statLabel}>Reminders</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Configuration</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Server URL</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="https://your-api.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Text style={styles.helperText}>
            Configure your backend API URL for syncing data across devices
          </Text>
          <Pressable
            style={[styles.button, isSyncing && styles.buttonDisabled]}
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
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <Pressable style={styles.menuItem} onPress={handleClearNotifications}>
            <Ionicons name="notifications-off-outline" size={24} color="#FF3B30" />
            <Text style={styles.menuItemText}>Clear All Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Data Storage</Text>
            <Text style={styles.aboutValue}>Local (SQLite)</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#fff",
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
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#007AFF",
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
    color: "#333",
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  aboutLabel: {
    fontSize: 16,
    color: "#666",
  },
  aboutValue: {
    fontSize: 16,
    color: "#333",
  },
});
