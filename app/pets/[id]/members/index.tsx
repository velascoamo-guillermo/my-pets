import { MemberCard } from "@/components/MemberCard";
import { usePetMembersScreen } from "@/hooks/usePetMembersScreen";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const colors = {
  light: {
    background: "#FFF0F5",
    cardBackground: "#ffffff",
    text: "#333",
    textSecondary: "#666",
    textTertiary: "#999",
    tint: "#D4517A",
  },
  dark: {
    background: "#1a0d12",
    cardBackground: "#2a1520",
    text: "#ffffff",
    textSecondary: "#aaaaaa",
    textTertiary: "#777",
    tint: "#F07098",
  },
};

export default function PetMembersScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const { pet, shares, isLoading, handleRemoveMember, handleInvitePress } =
    usePetMembersScreen();

  return (
    <>
      <Stack.Screen
        options={{
          title: pet ? `${pet.name} — Members` : "Members",
          headerRight: () => (
            <Pressable style={styles.headerButton} onPress={handleInvitePress}>
              <Ionicons name="person-add-outline" size={22} color={theme.tint} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Members with access
          </Text>

          {isLoading ? (
            <ActivityIndicator size="small" color={theme.tint} style={styles.loader} />
          ) : shares.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: theme.cardBackground }]}>
              <Ionicons name="people-outline" size={36} color={theme.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No members yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
                Tap the + button to invite someone
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {shares.map((share) => (
                <MemberCard
                  key={share.id}
                  share={share}
                  onRemove={() =>
                    handleRemoveMember(
                      share.memberId,
                      share.memberDisplayName ?? share.memberEmail ?? share.memberId,
                    )
                  }
                />
              ))}
            </View>
          )}
        </View>

        <Pressable
          style={[styles.inviteButton, { backgroundColor: theme.tint }]}
          onPress={handleInvitePress}
        >
          <Ionicons name="person-add-outline" size={20} color="#fff" />
          <Text style={styles.inviteButtonText}>Invite someone</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerButton: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  loader: { marginTop: 24 },
  list: { gap: 8 },
  empty: {
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyText: { fontSize: 16, fontWeight: "500" },
  emptySubtext: { fontSize: 14, textAlign: "center" },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    margin: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
  },
  inviteButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
