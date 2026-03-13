import { useSettingsScreen } from "@/hooks/useSettingsScreen";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
} from "react-native";

const colors = {
  light: {
    background: "#FFF0F5",
    cardBackground: "#ffffff",
    text: "#333",
    textSecondary: "#666",
    textTertiary: "#999",
    tint: "#D4517A",
    chevron: "#999",
  },
  dark: {
    background: "#1a0d12",
    cardBackground: "#2a1520",
    text: "#ffffff",
    textSecondary: "#aaaaaa",
    textTertiary: "#777",
    tint: "#F07098",
    chevron: "#666",
  },
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const {
    totalPending,
    lastSyncLabel,
    scheduledNotifications,
    isSyncing,
    userEmail,
    userProvider,
    handleSync,
    handleClearNotifications,
    handleSignOut,
  } = useSettingsScreen();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Account */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Account
        </Text>
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: theme.textSecondary }]}>
              Signed in as
            </Text>
            <Text
              style={[styles.aboutValue, { color: theme.text }]}
              numberOfLines={1}
            >
              {userEmail ?? userProvider}
            </Text>
          </View>
          <Pressable style={styles.menuItem} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={[styles.menuItemText, { color: "#FF3B30" }]}>
              Sign Out
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Sync Status
        </Text>
        <View
          style={[styles.card, { backgroundColor: theme.cardBackground }]}
        >
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons
                name={
                  totalPending > 0
                    ? "cloud-upload-outline"
                    : "checkmark-circle"
                }
                size={24}
                color={totalPending > 0 ? "#FF9500" : "#4CAF50"}
              />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {totalPending}
              </Text>
              <Text
                style={[styles.statLabel, { color: theme.textSecondary }]}
              >
                Pending
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={24} color={theme.tint} />
              <Text
                style={[
                  styles.statValue,
                  { color: theme.text, fontSize: 14 },
                ]}
              >
                {lastSyncLabel}
              </Text>
              <Text
                style={[styles.statLabel, { color: theme.textSecondary }]}
              >
                Last Sync
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={theme.tint}
              />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {scheduledNotifications}
              </Text>
              <Text
                style={[styles.statLabel, { color: theme.textSecondary }]}
              >
                Reminders
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View
          style={[styles.card, { backgroundColor: theme.cardBackground }]}
        >
          <Pressable
            style={[
              styles.button,
              { backgroundColor: theme.tint },
              isSyncing && styles.buttonDisabled,
            ]}
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
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Notifications
        </Text>
        <View
          style={[styles.card, { backgroundColor: theme.cardBackground }]}
        >
          <Pressable
            style={styles.menuItem}
            onPress={handleClearNotifications}
          >
            <Ionicons
              name="notifications-off-outline"
              size={24}
              color="#FF3B30"
            />
            <Text style={[styles.menuItemText, { color: theme.text }]}>
              Clear All Notifications
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.chevron}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          About
        </Text>
        <View
          style={[styles.card, { backgroundColor: theme.cardBackground }]}
        >
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: theme.textSecondary }]}>
              Version
            </Text>
            <Text style={[styles.aboutValue, { color: theme.text }]}>
              1.0.0
            </Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: theme.textSecondary }]}>
              Data Storage
            </Text>
            <Text style={[styles.aboutValue, { color: theme.text }]}>
              Local + Supabase
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: { borderRadius: 12, padding: 16 },
  statRow: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center", gap: 4 },
  statValue: { fontSize: 24, fontWeight: "700" },
  statLabel: { fontSize: 12 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  menuItemText: { flex: 1, fontSize: 16 },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  aboutLabel: { fontSize: 16 },
  aboutValue: { fontSize: 16 },
});
