import { FileCard } from "@/components/FileCard";
import { VisitCard } from "@/components/VisitCard";
import { cancelNotificationForVisit } from "@/hooks/useNotifications";
import {
  useAddPetFile,
  useDeletePetFile,
  useFilesByPet,
} from "@/hooks/usePetFiles";
import { useDeletePet, usePet } from "@/hooks/usePets";
import {
  useDeleteVisit,
  useMarkVisitComplete,
  useVisitsByPet,
} from "@/hooks/useVisits";
import { syncWithSupabase } from "@/services/sync";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File as FSFile, Paths } from "expo-file-system";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const colors = {
  light: {
    background: "#f5f5f5",
    cardBackground: "#ffffff",
    text: "#333",
    textSecondary: "#666",
    textTertiary: "#999",
    tint: "#007AFF",
    placeholder: "#f0f0f0",
    placeholderIcon: "#ccc",
    emptyIcon: "#ccc",
  },
  dark: {
    background: "#000000",
    cardBackground: "#1c1c1e",
    text: "#ffffff",
    textSecondary: "#aaaaaa",
    textTertiary: "#777",
    tint: "#0A84FF",
    placeholder: "#2c2c2e",
    placeholderIcon: "#555",
    emptyIcon: "#555",
  },
};

export default function PetDetailScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pet, isLoading: isPetLoading } = usePet(id);
  const { remove } = useDeletePet();
  const {
    visits,
    isLoading: isVisitsLoading,
    refetch: refetchVisits,
  } = useVisitsByPet(id);
  const { markComplete } = useMarkVisitComplete();
  const { remove: removeVisit } = useDeleteVisit();
  const {
    files,
    isLoading: isFilesLoading,
    refetch: refetchFiles,
  } = useFilesByPet(id);
  const { addFile } = useAddPetFile();
  const { removeFile } = useDeletePetFile();

  useFocusEffect(
    useCallback(() => {
      refetchVisits();
      refetchFiles();
    }, [refetchVisits, refetchFiles]),
  );

  const handleDelete = () => {
    Alert.alert(
      "Delete Pet",
      `Are you sure you want to delete ${pet?.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!id) return;
            await remove(id);
            router.back();
          },
        },
      ],
    );
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const fileName = `${Date.now()}_${asset.name}`;

      const destDir = new Directory(Paths.document, "pet-files");
      if (!destDir.exists) {
        destDir.create({ intermediates: true });
      }

      const sourceFile = new FSFile(asset.uri);
      const destFile = new FSFile(destDir, fileName);
      sourceFile.copy(destFile);

      await addFile({
        petId: id!,
        name: asset.name,
        uri: destFile.uri,
        fileType: asset.mimeType ?? "application/octet-stream",
        fileSize: asset.size ?? 0,
      });

      refetchFiles();
      syncWithSupabase().catch(() => {});
    } catch {
      Alert.alert("Error", "Failed to add file. Please try again.");
    }
  };

  const handleDeleteFile = async (fileId: string, fileUri: string) => {
    await removeFile(fileId, fileUri);
    refetchFiles();
  };

  const handleDeleteVisit = (visitId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const visit = visits.find((v) => v.id === visitId);
    Alert.alert(
      "Delete Visit",
      `Are you sure you want to delete "${visit?.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await removeVisit(visitId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            refetchVisits();
          },
        },
      ],
    );
  };

  const handleCompleteVisit = async (visitId: string) => {
    const visit = visits.find((v) => v.id === visitId);
    if (visit) {
      await cancelNotificationForVisit(visit);
    }
    await markComplete(visitId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    refetchVisits();
  };

  if (isPetLoading || !pet) {
    return (
      <>
        <Stack.Screen options={{ title: "Pet Details" }} />
        <View style={[styles.loading, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      </>
    );
  }

  const speciesIcon = pet.species === "dog" ? "🐕" : "🐈";
  const age = pet.birthDate ? calculateAge(pet.birthDate) : null;

  const upcomingVisits = visits.filter(
    (v) => !v.completed && new Date(v.scheduledDate) >= new Date(),
  );
  const pastVisits = visits.filter(
    (v) => v.completed || new Date(v.scheduledDate) < new Date(),
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: pet.name,
          headerRight: () => (
            <Pressable
              style={styles.headerButton}
              onPress={() => router.push(`/pets/${id}/edit`)}
            >
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
          {pet.imageUri ? (
            <Image source={{ uri: pet.imageUri }} style={styles.image} />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                { backgroundColor: theme.placeholder },
              ]}
            >
              <Ionicons name="paw" size={60} color={theme.placeholderIcon} />
            </View>
          )}
          <Text style={[styles.name, { color: theme.text }]}>{pet.name}</Text>
          <Text style={[styles.species, { color: theme.textSecondary }]}>
            {speciesIcon}{" "}
            {pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
          </Text>
          {age && (
            <Text style={[styles.age, { color: theme.textSecondary }]}>
              {age}
            </Text>
          )}
        </View>

        {(pet.vetName || pet.vetPhone || pet.vetAddress) && (
          <View style={styles.infoSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Veterinarian
            </Text>
            <View
              style={[
                styles.infoCard,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              {pet.vetName && (
                <View style={styles.infoRow}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[styles.infoLabel, { color: theme.textSecondary }]}
                  >
                    Name
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {pet.vetName}
                  </Text>
                </View>
              )}
              {pet.vetPhone && (
                <Pressable
                  style={styles.infoRow}
                  onPress={() => Linking.openURL(`tel:${pet.vetPhone}`)}
                >
                  <Ionicons name="call-outline" size={20} color={theme.tint} />
                  <Text
                    style={[styles.infoLabel, { color: theme.textSecondary }]}
                  >
                    Phone
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.tint }]}>
                    {pet.vetPhone}
                  </Text>
                </Pressable>
              )}
              {pet.vetAddress && (
                <Pressable
                  style={styles.infoRow}
                  onPress={() => {
                    const encoded = encodeURIComponent(pet.vetAddress!);
                    const url =
                      process.env.EXPO_OS === "ios"
                        ? `maps:?q=${encoded}`
                        : `geo:0,0?q=${encoded}`;
                    Linking.openURL(url);
                  }}
                >
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={theme.tint}
                  />
                  <Text
                    style={[styles.infoLabel, { color: theme.textSecondary }]}
                  >
                    Address
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.tint }]}>
                    {pet.vetAddress}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        <View style={styles.infoSection}>
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
                styles.emptyVisits,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <Ionicons
                name="document-outline"
                size={32}
                color={theme.emptyIcon}
              />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No files yet
              </Text>
              <Text
                style={[styles.emptySubtext, { color: theme.textTertiary }]}
              >
                Tap Add to upload documents or PDFs
              </Text>
            </View>
          ) : (
            <View style={styles.visitsList}>
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onDelete={() => handleDeleteFile(file.id, file.uri)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Upcoming Visits
            </Text>
            <Pressable
              style={styles.addButton}
              onPress={() => router.push(`/pets/${id}/visits/new`)}
            >
              <Ionicons name="add" size={20} color={theme.tint} />
              <Text style={[styles.addButtonText, { color: theme.tint }]}>
                Add
              </Text>
            </Pressable>
          </View>
          {isVisitsLoading ? (
            <ActivityIndicator size="small" color={theme.tint} />
          ) : upcomingVisits.length === 0 ? (
            <View
              style={[
                styles.emptyVisits,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <Ionicons
                name="medical-outline"
                size={32}
                color={theme.emptyIcon}
              />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No upcoming visits
              </Text>
              <Text
                style={[styles.emptySubtext, { color: theme.textTertiary }]}
              >
                Tap Add to schedule a vaccination or checkup
              </Text>
            </View>
          ) : (
            <View style={styles.visitsList}>
              {upcomingVisits.map((visit) => (
                <VisitCard
                  key={visit.id}
                  visit={visit}
                  onPress={() => router.push(`/visits/${visit.id}/edit`)}
                  onComplete={() => handleCompleteVisit(visit.id)}
                  onDelete={() => handleDeleteVisit(visit.id)}
                />
              ))}
            </View>
          )}
        </View>

        {pastVisits.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Past Visits
            </Text>
            <View style={styles.visitsList}>
              {pastVisits.map((visit) => (
                <VisitCard
                  key={visit.id}
                  visit={visit}
                  onPress={() => router.push(`/visits/${visit.id}/edit`)}
                  onDelete={() => handleDeleteVisit(visit.id)}
                />
              ))}
            </View>
          </View>
        )}

        <Pressable
          style={[
            styles.deleteButton,
            { backgroundColor: theme.cardBackground },
          ]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Delete Pet</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

function calculateAge(birthDate: Date): string {
  const now = new Date();
  const years = now.getFullYear() - birthDate.getFullYear();
  const months = now.getMonth() - birthDate.getMonth();

  if (years < 1) {
    const totalMonths = months >= 0 ? months : 12 + months;
    return `${totalMonths} month${totalMonths !== 1 ? "s" : ""}`;
  }

  if (years === 1 && months < 0) {
    const totalMonths = 12 + months;
    return `${totalMonths} month${totalMonths !== 1 ? "s" : ""}`;
  }

  return `${years} year${years !== 1 ? "s" : ""} old`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  headerButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 16,
  },
  species: {
    fontSize: 16,
    marginTop: 4,
  },
  age: {
    fontSize: 14,
    marginTop: 2,
  },
  infoSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  visitsList: {
    gap: 4,
  },
  emptyVisits: {
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: 32,
    marginHorizontal: 16,
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
