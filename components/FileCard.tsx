import { View, Text, StyleSheet, Pressable, Alert, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Sentry from "@sentry/react-native";
import * as Sharing from "expo-sharing";
import type { PetFile } from "@/db/schema";

const colors = {
  light: {
    cardBackground: "#ffffff",
    text: "#333",
    textSecondary: "#666",
    danger: "#FF3B30",
  },
  dark: {
    cardBackground: "#1c1c1e",
    text: "#ffffff",
    textSecondary: "#aaaaaa",
    danger: "#FF453A",
  },
};

type FileCardProps = {
  file: PetFile;
  onDelete: () => void;
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

export function FileCard({ file, onDelete }: FileCardProps) {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const icon = getFileIcon(file.fileType);
  const iconColor = getFileIconColor(file.fileType);

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

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.cardBackground },
        pressed && styles.cardPressed,
      ]}
      onPress={handleOpen}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconColor + "20" }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {file.name}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {formatFileSize(file.fileSize)} · {file.createdAt.toLocaleDateString()}
        </Text>
      </View>
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
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});
