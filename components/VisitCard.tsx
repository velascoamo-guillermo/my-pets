import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { VetVisit } from "@/db/schema";

type VisitCardProps = {
  visit: VetVisit;
  onPress: () => void;
  onComplete?: () => void;
};

const TYPE_CONFIG = {
  vaccination: { icon: "medical", color: "#4CAF50" },
  checkup: { icon: "fitness", color: "#2196F3" },
  emergency: { icon: "alert-circle", color: "#F44336" },
  other: { icon: "ellipsis-horizontal", color: "#9E9E9E" },
} as const;

export function VisitCard({ visit, onPress, onComplete }: VisitCardProps) {
  const config = TYPE_CONFIG[visit.type];
  const isUpcoming = new Date(visit.scheduledDate) > new Date();
  const isPast = !isUpcoming && !visit.completed;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        visit.completed && styles.cardCompleted,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: config.color + "20" }]}>
        <Ionicons
          name={config.icon as keyof typeof Ionicons.glyphMap}
          size={24}
          color={config.color}
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, visit.completed && styles.titleCompleted]}>
          {visit.title}
        </Text>
        <Text style={styles.date}>
          {visit.scheduledDate.toLocaleDateString()} at{" "}
          {visit.scheduledDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        {visit.completed && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
            <Text style={styles.completedText}>Completed</Text>
          </View>
        )}
        {isPast && (
          <View style={styles.missedBadge}>
            <Ionicons name="warning" size={14} color="#F44336" />
            <Text style={styles.missedText}>Missed</Text>
          </View>
        )}
      </View>
      {!visit.completed && isUpcoming && onComplete && (
        <Pressable
          style={styles.completeButton}
          onPress={(e) => {
            e.stopPropagation();
            onComplete();
          }}
        >
          <Ionicons name="checkmark" size={20} color="#4CAF50" />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardCompleted: {
    opacity: 0.7,
  },
  cardPressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  titleCompleted: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  date: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  completedText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
  },
  missedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  missedText: {
    fontSize: 12,
    color: "#F44336",
    fontWeight: "500",
  },
  completeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
});
