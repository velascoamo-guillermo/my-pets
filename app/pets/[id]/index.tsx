import { FileCard } from "@/components/FileCard";
import { VisitCard } from "@/components/VisitCard";
import { usePetDetailScreen } from "@/hooks/usePetDetailScreen";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Reanimated, { LinearTransition } from "react-native-reanimated";

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
  const {
    pet,
    isPetLoading,
    isVisitsLoading,
    files,
    isFilesLoading,
    analyzingFileId,
    upcomingVisits,
    pastVisits,
    age,
    handleDelete,
    handlePickFile,
    handleDeleteFile,
    handleAnalyzeFile,
    handleDeleteVisit,
    handleCompleteVisit,
    handleEditPress,
    handleAddVisitPress,
    handleVisitPress,
  } = usePetDetailScreen();

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

  const speciesIcon = pet.species === "dog" ? "\u{1F415}" : "\u{1F408}";

  return (
    <>
      <Stack.Screen
        options={{
          title: pet.name,
          headerRight: () => (
            <Pressable
              testID="edit-pet-button"
              style={styles.headerButton}
              onPress={handleEditPress}
            >
              <Ionicons name="pencil" size={22} color={theme.tint} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        testID="pet-detail-screen"
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
              Next Appointments
            </Text>
            <Pressable
              testID="add-visit-button"
              style={styles.addButton}
              onPress={handleAddVisitPress}
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
                No upcoming appointments
              </Text>
              <Text
                style={[styles.emptySubtext, { color: theme.textTertiary }]}
              >
                Tap Add to schedule a new appointment
              </Text>
            </View>
          ) : (
            <Reanimated.FlatList
              data={upcomingVisits}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              itemLayoutAnimation={LinearTransition}
              renderItem={({ item: visit }) => (
                <VisitCard
                  visit={visit}
                  onPress={() => handleVisitPress(visit.id)}
                  onComplete={() => handleCompleteVisit(visit.id)}
                  onDelete={(close) => handleDeleteVisit(visit.id, close)}
                />
              )}
              style={styles.visitsList}
            />
          )}
        </View>

        {pastVisits.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Clinical History
            </Text>
            <View style={styles.visitsList}>
              {pastVisits.map((visit) => (
                <VisitCard
                  key={visit.id}
                  visit={visit}
                  onPress={() => handleVisitPress(visit.id)}
                  onDelete={(close) => handleDeleteVisit(visit.id, close)}
                />
              ))}
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
                  onAnalyze={
                    file.remoteUri
                      ? () => handleAnalyzeFile(file.id, file.remoteUri!)
                      : undefined
                  }
                  analyzingFileId={analyzingFileId}
                />
              ))}
            </View>
          )}
        </View>

        <Pressable
          testID="delete-pet-button"
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 16 },
  headerButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  image: { width: 120, height: 120, borderRadius: 60 },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  name: { fontSize: 28, fontWeight: "700", marginTop: 16 },
  species: { fontSize: 16, marginTop: 4 },
  age: { fontSize: 14, marginTop: 2 },
  infoSection: { marginTop: 16, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  infoCard: { borderRadius: 12, padding: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  infoLabel: { flex: 1, fontSize: 16, marginLeft: 12 },
  infoValue: { fontSize: 16, fontWeight: "500" },
  addButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  addButtonText: { fontSize: 16, fontWeight: "500" },
  visitsList: { gap: 4 },
  emptyVisits: { borderRadius: 12, padding: 24, alignItems: "center" },
  emptyText: { fontSize: 16, marginTop: 12 },
  emptySubtext: { fontSize: 14, marginTop: 4, textAlign: "center" },
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
  deleteButtonText: { color: "#FF3B30", fontSize: 16, fontWeight: "500" },
});
