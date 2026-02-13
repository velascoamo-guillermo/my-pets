import { PetCard } from "@/components/PetCard";
import { usePetListScreen } from "@/hooks/usePetListScreen";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const colors = {
  light: {
    background: "#f5f5f5",
    tint: "#007AFF",
    emptyIcon: "#ccc",
    emptyText: "#666",
    emptySubtext: "#999",
  },
  dark: {
    background: "#000000",
    tint: "#0A84FF",
    emptyIcon: "#555",
    emptyText: "#aaa",
    emptySubtext: "#777",
  },
};

export default function PetsScreen() {
  const { pets, isLoading, isFetching, refetch, handlePetPress } =
    usePetListScreen();
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];

  if (isLoading && pets.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        testID="pet-list"
        data={pets}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentInsetAdjustmentBehavior="automatic"
        renderItem={({ item }) => (
          <PetCard pet={item} onPress={() => handlePetPress(item.id)} />
        )}
        contentContainerStyle={
          pets.length === 0 ? styles.emptyList : styles.list
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="paw" size={64} color={theme.emptyIcon} />
            <Text style={[styles.emptyText, { color: theme.emptyText }]}>
              No pets yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.emptySubtext }]}>
              Tap + in the header to add your first pet
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingHorizontal: 16, paddingVertical: 8 },
  row: { justifyContent: "space-between", marginBottom: 12 },
  emptyList: { flex: 1 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: { fontSize: 20, fontWeight: "600", marginTop: 16 },
  emptySubtext: { fontSize: 14, marginTop: 8, textAlign: "center" },
});
