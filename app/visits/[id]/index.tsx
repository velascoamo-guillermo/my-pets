import { FileCard } from "@/components/FileCard";
import { useVisitDetailScreen } from "@/hooks/useVisitDetailScreen";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

const colors = {
  light: {
    background: "#f5f5f5",
    cardBackground: "#ffffff",
    text: "#333",
    textSecondary: "#666",
    textTertiary: "#999",
    tint: "#007AFF",
  },
  dark: {
    background: "#000000",
    cardBackground: "#1c1c1e",
    text: "#ffffff",
    textSecondary: "#aaaaaa",
    textTertiary: "#777",
    tint: "#0A84FF",
  },
};

const TYPE_CONFIG = {
  vaccination: { icon: "medical", label: "Vaccination", color: "#4CAF50" },
  checkup: { icon: "fitness", label: "Checkup", color: "#2196F3" },
  emergency: { icon: "alert-circle", label: "Emergency", color: "#F44336" },
  other: { icon: "ellipsis-horizontal", label: "Other", color: "#9E9E9E" },
} as const;

export default function VisitDetailScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const {
    visit,
    pet,
    files,
    isLoading,
    isFilesLoading,
    handleEdit,
    handleComplete,
    handleDelete,
    handlePetPress,
    handlePickFile,
    handleDeleteFile,
    handleAnalyzeFile,
  } = useVisitDetailScreen();

  if (isLoading || !visit) {
    return (
      <>
        <Stack.Screen options={{ title: "Visit Details" }} />
        <View style={[styles.loading, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      </>
    );
  }

  const config = TYPE_CONFIG[visit.type];
  const isUpcoming = new Date(visit.scheduledDate) > new Date();
  const isPast = !isUpcoming && !visit.completed;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Visit Details",
          headerRight: () => (
            <Pressable style={styles.headerButton} onPress={handleEdit}>
              <Ionicons name="pencil" size={22} color={theme.tint} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View
          style={[styles.header, { backgroundColor: theme.cardBackground }]}
        >
          <View
            style={[
              styles.typeIcon,
              { backgroundColor: config.color + "20" },
            ]}
          >
            <Ionicons
              name={config.icon as keyof typeof Ionicons.glyphMap}
              size={32}
              color={config.color}
            />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            {visit.title}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: config.color + "20" }]}>
            <Text style={[styles.typeBadgeText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
          {visit.completed && (
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
          {isPast && (
            <View style={styles.statusBadge}>
              <Ionicons name="warning" size={16} color="#F44336" />
              <Text style={styles.missedText}>Missed</Text>
            </View>
          )}
          {isUpcoming && !visit.completed && (
            <View style={styles.statusBadge}>
              <Ionicons name="time-outline" size={16} color="#FF9500" />
              <Text style={styles.upcomingText}>Upcoming</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.textSecondary}
              />
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Scheduled
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {visit.scheduledDate.toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons
                name="time-outline"
                size={20}
                color={theme.textSecondary}
              />
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Time
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {visit.scheduledDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            {visit.completedDate && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={20}
                  color="#4CAF50"
                />
                <Text
                  style={[styles.infoLabel, { color: theme.textSecondary }]}
                >
                  Completed
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {visit.completedDate.toLocaleDateString()}
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={theme.textSecondary}
              />
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Reminder
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {visit.reminderDays} day{visit.reminderDays !== 1 ? "s" : ""}{" "}
                before
              </Text>
            </View>
            {pet && (
              <Pressable style={styles.infoRow} onPress={handlePetPress}>
                <Ionicons name="paw-outline" size={20} color={theme.tint} />
                <Text
                  style={[styles.infoLabel, { color: theme.textSecondary }]}
                >
                  Pet
                </Text>
                <Text style={[styles.infoValue, { color: theme.tint }]}>
                  {pet.name}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {visit.notes ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Notes
            </Text>
            <View
              style={[
                styles.notesCard,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <Text style={[styles.notesText, { color: theme.text }]}>
                {visit.notes}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Files
            </Text>
            <Pressable style={styles.addButton} onPress={handlePickFile}>
              <Ionicons name="add" size={20} color={theme.tint} />
              <Text style={[styles.addButtonText, { color: theme.tint }]}>
                Add
              </Text>
            </Pressable>
          </View>
          {isFilesLoading ? (
            <ActivityIndicator size="small" color={theme.tint} />
          ) : files.length === 0 ? (
            <View
              style={[
                styles.emptyFiles,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <Ionicons
                name="document-outline"
                size={32}
                color={theme.textTertiary}
              />
              <Text
                style={[styles.emptyFilesText, { color: theme.textSecondary }]}
              >
                No files yet
              </Text>
              <Text
                style={[
                  styles.emptyFilesSubtext,
                  { color: theme.textTertiary },
                ]}
              >
                Tap Add to attach documents
              </Text>
            </View>
          ) : (
            <View style={styles.filesList}>
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onDelete={(close) => handleDeleteFile(file.id, file.uri, close)}
                  onAnalyze={
                    file.remoteUri
                      ? () => handleAnalyzeFile(file.id, file.remoteUri!)
                      : undefined
                  }
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.actions}>
          {!visit.completed && (
            <Pressable
              style={[
                styles.completeButton,
                { backgroundColor: theme.cardBackground },
              ]}
              onPress={handleComplete}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
              <Text style={styles.completeButtonText}>Mark as Completed</Text>
            </Pressable>
          )}
          <Pressable
            style={[
              styles.deleteButton,
              { backgroundColor: theme.cardBackground },
            ]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.deleteButtonText}>Delete Visit</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  typeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
    textAlign: "center",
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  completedText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
  missedText: {
    fontSize: 14,
    color: "#F44336",
    fontWeight: "500",
  },
  upcomingText: {
    fontSize: 14,
    color: "#FF9500",
    fontWeight: "500",
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  addButtonText: { fontSize: 16, fontWeight: "500" },
  filesList: { gap: 4 },
  emptyFiles: { borderRadius: 12, padding: 24, alignItems: "center" },
  emptyFilesText: { fontSize: 16, marginTop: 12 },
  emptyFilesSubtext: { fontSize: 14, marginTop: 4, textAlign: "center" },
  infoCard: {
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  notesCard: {
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    marginVertical: 32,
    marginHorizontal: 16,
    gap: 12,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  completeButtonText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "500",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  deleteButtonText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "500",
  },
});
