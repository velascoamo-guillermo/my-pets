import type { VetVisit } from "@/db/schema";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import {
  Gesture,
  GestureDetector,
  RectButton,
} from "react-native-gesture-handler";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, {
  type SharedValue,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const colors = {
  light: {
    cardBackground: "#ffffff",
    text: "#333",
    textSecondary: "#666",
    textCompleted: "#999",
  },
  dark: {
    cardBackground: "#1c1c1e",
    text: "#ffffff",
    textSecondary: "#aaaaaa",
    textCompleted: "#666",
  },
};

type VisitCardProps = {
  visit: VetVisit;
  onPress: () => void;
  onComplete?: () => void;
  onDelete?: (close: () => void) => void;
};

const TYPE_CONFIG = {
  vaccination: { icon: "medical", color: "#4CAF50" },
  checkup: { icon: "fitness", color: "#2196F3" },
  emergency: { icon: "alert-circle", color: "#F44336" },
  other: { icon: "ellipsis-horizontal", color: "#9E9E9E" },
} as const;

function DeleteAction({
  drag,
  onPress,
}: {
  drag: SharedValue<number>;
  onPress: () => void;
}) {
  const triggered = useSharedValue(false);

  useAnimatedReaction(
    () => Math.abs(drag.value),
    (absDrag) => {
      if (absDrag > 280 && !triggered.value) {
        triggered.value = true;
        scheduleOnRN(onPress);
      }
      if (absDrag < 40) {
        triggered.value = false;
      }
    },
  );

  const circleStyle = useAnimatedStyle(() => {
    const absDrag = Math.abs(drag.value);
    const scale = interpolate(absDrag, [0, 80], [0.4, 1], "clamp");
    const width = interpolate(absDrag, [80, 200], [48, 160], "extend");
    return {
      transform: [{ scale }],
      width: Math.max(48, width),
    };
  });

  return (
    <RectButton style={styles.deleteAction} onPress={onPress}>
      <Reanimated.View style={[styles.deleteCircle, circleStyle]}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
      </Reanimated.View>
    </RectButton>
  );
}

function CardContent({
  visit,
  onComplete,
  theme,
  config,
}: {
  visit: VetVisit;
  onComplete?: () => void;
  theme: typeof colors.light;
  config: (typeof TYPE_CONFIG)[keyof typeof TYPE_CONFIG];
}) {
  const isUpcoming = new Date(visit.scheduledDate) > new Date();
  const isPast = !isUpcoming && !visit.completed;

  return (
    <>
      <View
        style={[styles.iconContainer, { backgroundColor: config.color + "20" }]}
      >
        <Ionicons
          name={config.icon as keyof typeof Ionicons.glyphMap}
          size={24}
          color={config.color}
        />
      </View>
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: theme.text },
            visit.completed && {
              textDecorationLine: "line-through",
              color: theme.textCompleted,
            },
          ]}
        >
          {visit.title}
        </Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
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
      {visit.syncStatus === "pending" && (
        <View style={styles.syncBadge}>
          <Ionicons name="cloud-upload-outline" size={14} color="#FF9500" />
        </View>
      )}
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
    </>
  );
}

export function VisitCard({
  visit,
  onPress,
  onComplete,
  onDelete,
}: VisitCardProps) {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const config = TYPE_CONFIG[visit.type];
  const swipeableRef = useRef<SwipeableMethods>(null);

  const handleDelete = useCallback(() => {
    const close = () => swipeableRef.current?.close();
    onDelete?.(close);
  }, [onDelete]);

  if (!onDelete) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.cardBackground },
          visit.completed && styles.cardCompleted,
          pressed && styles.cardPressed,
        ]}
        onPress={onPress}
      >
        <CardContent
          visit={visit}
          onComplete={onComplete}
          theme={theme}
          config={config}
        />
      </Pressable>
    );
  }

  const tap = Gesture.Tap().onEnd(() => {
    scheduleOnRN(onPress);
  });

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={1.5}
      rightThreshold={80}
      overshootRight
      renderRightActions={(_progress, drag) => (
        <DeleteAction drag={drag} onPress={handleDelete} />
      )}
      onSwipeableWillOpen={() => {}}
    >
      <GestureDetector gesture={tap}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardBackground },
            visit.completed && styles.cardCompleted,
          ]}
        >
          <CardContent
            visit={visit}
            onComplete={onComplete}
            theme={theme}
            config={config}
          />
        </View>
      </GestureDetector>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderCurve: "continuous",
    padding: 12,
    marginVertical: 4,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
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
  },
  date: {
    fontSize: 14,
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
  deleteAction: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 16,
    marginVertical: 4,
  },
  deleteCircle: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
  syncBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,149,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
});
