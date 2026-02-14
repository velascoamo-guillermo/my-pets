import { useAnalysisByFile } from "@/hooks/useFileAnalyses";
import type { PetFile } from "@/db/schema";
import { Ionicons } from "@expo/vector-icons";
import * as Sentry from "@sentry/react-native";
import * as Sharing from "expo-sharing";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

const colors = {
  light: {
    cardBackground: "#ffffff",
    text: "#333",
    textSecondary: "#666",
    tint: "#007AFF",
    danger: "#FF3B30",
    success: "#4CAF50",
  },
  dark: {
    cardBackground: "#1c1c1e",
    text: "#ffffff",
    textSecondary: "#aaaaaa",
    tint: "#0A84FF",
    danger: "#FF453A",
    success: "#32D74B",
  },
};

type FileCardProps = {
  file: PetFile;
  onDelete: () => void;
  onAnalyze?: () => void;
  analyzingFileId?: string | null;
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

export function FileCard({
  file,
  onDelete,
  onAnalyze,
  analyzingFileId,
}: FileCardProps) {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const router = useRouter();
  const icon = getFileIcon(file.fileType);
  const iconColor = getFileIconColor(file.fileType);

  const isPdf = file.fileType.includes("pdf");
  const { data: analysis } = useAnalysisByFile(isPdf ? file.id : undefined);
  const hasAnalysis = analysis?.status === "completed";
  const isAnalyzing = analyzingFileId === file.id;
  const canAnalyze = isPdf && !!onAnalyze && !!file.remoteUri;

  const handleOpen = async () => {
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
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete File",
      `Are you sure you want to delete "${file.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ]
    );
  };

  const handleAnalyzePress = () => {
    if (!file.remoteUri) {
      Alert.alert(
        "Sync Required",
        "This file needs to be synced before it can be analyzed."
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
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.cardBackground },
        pressed && styles.cardPressed,
      ]}
      onPress={handleOpen}
    >
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
        <Pressable
          style={styles.actionButton}
          onPress={handleAnalyzePress}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator size="small" color={theme.tint} />
          ) : (
            <Ionicons name="analytics-outline" size={20} color={theme.tint} />
          )}
        </Pressable>
      )}

      {hasAnalysis && (
        <Pressable style={styles.actionButton} onPress={handleViewAnalysis}>
          <Ionicons name="checkmark-circle" size={20} color={theme.success} />
        </Pressable>
      )}

      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={18} color={theme.danger} />
      </Pressable>
    </Pressable>
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
  cardPressed: {
    opacity: 0.7,
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
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});
