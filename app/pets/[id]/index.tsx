import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import { usePet, useDeletePet } from "@/hooks/usePets";
import { useVisitsByPet, useMarkVisitComplete } from "@/hooks/useVisits";
import { cancelNotificationForVisit } from "@/hooks/useNotifications";
import { VisitCard } from "@/components/VisitCard";

export default function PetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pet, isLoading: isPetLoading } = usePet(id);
  const { remove } = useDeletePet();
  const { visits, isLoading: isVisitsLoading, refetch: refetchVisits } = useVisitsByPet(id);
  const { markComplete } = useMarkVisitComplete();

  useFocusEffect(
    useCallback(() => {
      refetchVisits();
    }, [refetchVisits])
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
      ]
    );
  };

  const handleCompleteVisit = async (visitId: string) => {
    const visit = visits.find((v) => v.id === visitId);
    if (visit) {
      await cancelNotificationForVisit(visit);
    }
    await markComplete(visitId);
    refetchVisits();
  };

  if (isPetLoading || !pet) {
    return (
      <>
        <Stack.Screen options={{ title: "Pet Details" }} />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </>
    );
  }

  const speciesIcon = pet.species === "dog" ? "🐕" : "🐈";
  const age = pet.birthDate ? calculateAge(pet.birthDate) : null;

  const upcomingVisits = visits.filter(
    (v) => !v.completed && new Date(v.scheduledDate) >= new Date()
  );
  const pastVisits = visits.filter(
    (v) => v.completed || new Date(v.scheduledDate) < new Date()
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: pet.name,
          headerRight: () => (
            <Pressable onPress={() => router.push(`/pets/${id}/edit`)}>
              <Ionicons name="pencil" size={22} color="#007AFF" />
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          {pet.imageUri ? (
            <Image source={{ uri: pet.imageUri }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="paw" size={60} color="#ccc" />
            </View>
          )}
          <Text style={styles.name}>{pet.name}</Text>
          <Text style={styles.species}>
            {speciesIcon}{" "}
            {pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
            {pet.breed ? ` • ${pet.breed}` : ""}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Information</Text>
          <View style={styles.infoCard}>
            {age && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{age}</Text>
              </View>
            )}
            {pet.birthDate && (
              <View style={styles.infoRow}>
                <Ionicons name="gift-outline" size={20} color="#666" />
                <Text style={styles.infoLabel}>Birthday</Text>
                <Text style={styles.infoValue}>
                  {pet.birthDate.toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Visits</Text>
            <Pressable
              style={styles.addButton}
              onPress={() => router.push(`/pets/${id}/visits/new`)}
            >
              <Ionicons name="add" size={20} color="#007AFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>
          {isVisitsLoading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : upcomingVisits.length === 0 ? (
            <View style={styles.emptyVisits}>
              <Ionicons name="medical-outline" size={32} color="#ccc" />
              <Text style={styles.emptyText}>No upcoming visits</Text>
              <Text style={styles.emptySubtext}>
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
                />
              ))}
            </View>
          )}
        </View>

        {pastVisits.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Past Visits</Text>
            <View style={styles.visitsList}>
              {pastVisits.map((visit) => (
                <VisitCard
                  key={visit.id}
                  visit={visit}
                  onPress={() => router.push(`/visits/${visit.id}/edit`)}
                />
              ))}
            </View>
          </View>
        )}

        <Pressable style={styles.deleteButton} onPress={handleDelete}>
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
    backgroundColor: "#f5f5f5",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 24,
    paddingHorizontal: 16,
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
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
  },
  species: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
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
    color: "#333",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#fff",
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
    color: "#666",
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  visitsList: {
    gap: 4,
  },
  emptyVisits: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
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
    backgroundColor: "#fff",
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
