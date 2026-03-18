import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

export function SharedBadge() {
  const isDark = useColorScheme() === "dark";
  const tint = isDark ? "#F07098" : "#D4517A";
  const bg = isDark ? "#3a1a28" : "#fce4ec";

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Ionicons name="people-outline" size={13} color={tint} />
      <Text style={[styles.label, { color: tint }]}>Shared</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
