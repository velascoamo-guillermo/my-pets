import { useAnalysisByFile } from "@/hooks/useFileAnalyses";
import type { PetFile } from "@/db/schema";
import { Ionicons } from "@expo/vector-icons";
import * as Sentry from "@sentry/react-native";
import * as Sharing from "expo-sharing";
import { useRouter } from "expo-router";
import { useRef, useCallback } from "react";
import {
  Alert,
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
    tint: "#007AFF",
    success: "#4CAF50",
  },
  dark: {
    cardBackground: "#1c1c1e",
    text: "#ffffff",
    textSecondary: "#aaaaaa",
    tint: "#0A84FF",
    success: "#32D74B",
  },
};

type FileCardProps = {
  file: PetFile;
  onDelete: (close: () => void) => void;
  onAnalyze?: () => void;
};

function getFileIcon(fileType: string): keyof typeof Ionicons.glyphMap {
  if (fileType.includes("pdf")) return "document-text";
  if (fileType.includes("image")) return "image";
  return "document";
}

function getFileIconColor(fileType: string): string {
  if (fileType.includes("pdf")) return "#E53935";
  if (fileType.includes("image")) return "#43A047";
  return "#9E9E9E";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  file,
  theme,
  onAnalyze,
}: {
  file: PetFile;
  theme: (typeof colors)["light"];
  onAnalyze?: () => void;
}) {
  const router = useRouter();
  const icon = getFileIcon(file.fileType);
  const iconColor = getFileIconColor(file.fileType);

  const isPdf = file.fileType.includes("pdf");
  const { data: analysis } = useAnalysisByFile(isPdf ? file.id : undefined);
  const hasAnalysis = analysis?.status === "completed";
  const canAnalyze = isPdf && !!onAnalyze && !!file.remoteUri;

  const handleAnalyzePress = () => {
    if (!file.remoteUri) {
      Alert.alert(
        "Sync Required",
        "This file needs to be synced before it can be analyzed.",
      );
      return;
    }
    onAnalyze?.();
  };

  const handleViewAnalysis = () => {
    if (analysis) {
      router.push(`/analyses/${analysis.id}`);
    }
  };

  return (
    <>
      <View
        style={[styles.iconContainer, { backgroundColor: iconColor + "20" }]}
      >
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {file.name}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {formatFileSize(file.fileSize)} ·{" "}
          {file.createdAt.toLocaleDateString()}
        </Text>
        {hasAnalysis && (
          <Pressable
            style={styles.analysisIndicator}
            onPress={handleViewAnalysis}
          >
            <Ionicons name="analytics" size={14} color={theme.success} />
            <Text style={[styles.analysisText, { color: theme.success }]}>
              View results
            </Text>
          </Pressable>
        )}
      </View>

      {canAnalyze && !hasAnalysis && (
        <Pressable style={styles.actionButton} onPress={handleAnalyzePress}>
          <Ionicons name="analytics-outline" size={20} color={theme.tint} />
        </Pressable>
      )}

      {hasAnalysis && (
        <Pressable style={styles.actionButton} onPress={handleViewAnalysis}>
          <Ionicons name="checkmark-circle" size={20} color={theme.success} />
        </Pressable>
      )}
    </>
  );
}

export function FileCard({
  file,
  onDelete,
  onAnalyze,
}: FileCardProps) {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const swipeableRef = useRef<SwipeableMethods>(null);

  const handleDelete = useCallback(() => {
    const close = () => swipeableRef.current?.close();
    onDelete(close);
  }, [onDelete]);

  const router = useRouter();

  const handleOpen = useCallback(async () => {
    const isPdf = file.fileType.includes("pdf");
    if (isPdf) {
      router.push(`/pdf-viewer/${file.id}` as any);
      return;
    }
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri);
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (err) {
      Sentry.captureException(err);
      Alert.alert("Error", "Could not open file");
    }
  }, [file.fileType, file.id, file.uri, router]);

  const tap = Gesture.Tap().onEnd(() => {
    scheduleOnRN(handleOpen);
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
          style={[styles.card, { backgroundColor: theme.cardBackground }]}
        >
          <CardContent
            file={file}
            theme={theme}
            onAnalyze={onAnalyze}
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
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  analysisIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  analysisText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteAction: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 16,
  },
  deleteCircle: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
});
