import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePets } from "@/hooks/usePets";
import { PetCard } from "@/components/PetCard";

export default function PetsScreen() {
  const router = useRouter();
  const { pets, isLoading, refetch } = usePets();

  if (isLoading && pets.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={pets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PetCard
            pet={item}
            onPress={() => router.push(`/pets/${item.id}`)}
          />
        )}
        contentContainerStyle={pets.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="paw" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No pets yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add your first pet
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      />
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push("/pets/new")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingVertical: 8,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
