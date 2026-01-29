import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Calendar, type DateData } from "react-native-calendars";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useVisits, useMarkVisitComplete } from "@/hooks/useVisits";
import { usePets } from "@/hooks/usePets";
import { VisitCard } from "@/components/VisitCard";
import { cancelNotificationForVisit } from "@/hooks/useNotifications";

export default function CalendarScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const { visits, isLoading, refetch } = useVisits();
  const { pets } = usePets();
  const { markComplete } = useMarkVisitComplete();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const markedDates = useMemo(() => {
    const marks: Record<string, { marked: boolean; dotColor: string; selected?: boolean; selectedColor?: string }> = {};

    visits.forEach((visit) => {
      const dateStr = new Date(visit.scheduledDate).toISOString().split("T")[0];
      const dotColor = visit.completed ? "#4CAF50" : "#007AFF";
      marks[dateStr] = {
        marked: true,
        dotColor,
      };
    });

    if (selectedDate) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: "#007AFF",
      };
    }

    return marks;
  }, [visits, selectedDate]);

  const selectedDayVisits = useMemo(() => {
    return visits.filter((visit) => {
      const visitDate = new Date(visit.scheduledDate).toISOString().split("T")[0];
      return visitDate === selectedDate;
    });
  }, [visits, selectedDate]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleCompleteVisit = async (visitId: string) => {
    const visit = visits.find((v) => v.id === visitId);
    if (visit) {
      await cancelNotificationForVisit(visit);
    }
    await markComplete(visitId);
    refetch();
  };

  const getPetName = (petId: string) => {
    const pet = pets.find((p) => p.id === petId);
    return pet?.name ?? "Unknown Pet";
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        onDayPress={handleDayPress}
        theme={{
          todayTextColor: "#007AFF",
          selectedDayBackgroundColor: "#007AFF",
          selectedDayTextColor: "#fff",
          arrowColor: "#007AFF",
        }}
      />

      <View style={styles.visitsSection}>
        <Text style={styles.sectionTitle}>
          {formatDate(selectedDate)}
        </Text>

        <ScrollView style={styles.visitsList}>
          {selectedDayVisits.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No visits scheduled</Text>
            </View>
          ) : (
            selectedDayVisits.map((visit) => (
              <View key={visit.id} style={styles.visitItem}>
                <Text style={styles.petName}>{getPetName(visit.petId)}</Text>
                <VisitCard
                  visit={visit}
                  onPress={() => router.push(`/visits/${visit.id}/edit`)}
                  onComplete={
                    !visit.completed && new Date(visit.scheduledDate) >= new Date()
                      ? () => handleCompleteVisit(visit.id)
                      : undefined
                  }
                />
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayStr = today.toISOString().split("T")[0];
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  if (dateString === todayStr) {
    return "Today";
  }
  if (dateString === tomorrowStr) {
    return "Tomorrow";
  }

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
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
  visitsSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  visitsList: {
    flex: 1,
  },
  visitItem: {
    marginBottom: 8,
  },
  petName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
  },
});
