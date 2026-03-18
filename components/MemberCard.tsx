import type { PetShare } from "@/db/schema";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";

type Props = {
  share: PetShare;
  onRemove?: () => void;
};

export function MemberCard({ share, onRemove }: Props) {
  const isDark = useColorScheme() === "dark";
  const cardBg = isDark ? "#2a1520" : "#ffffff";
  const text = isDark ? "#ffffff" : "#333";
  const textSecondary = isDark ? "#aaaaaa" : "#666";
  const tint = isDark ? "#F07098" : "#D4517A";

  const displayName = share.memberDisplayName ?? share.memberEmail ?? share.memberId;
  const subtitle = share.memberDisplayName ? share.memberEmail : null;

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={22} color={tint} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: text }]} numberOfLines={1}>
          {displayName}
        </Text>
        {subtitle && (
          <Text style={[styles.email, { color: textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={({ pressed }) => [styles.removeButton, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="person-remove-outline" size={20} color="#FF3B30" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fce4ec",
    justifyContent: "center",
    alignItems: "center",
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "500" },
  email: { fontSize: 13, marginTop: 2 },
  removeButton: { padding: 4 },
});
