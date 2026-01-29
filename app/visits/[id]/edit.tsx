import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useVisit, useUpdateVisit } from "@/hooks/useVisits";
import { VisitForm } from "@/components/VisitForm";

export default function EditVisitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { visit, isLoading } = useVisit(id);
  const { update } = useUpdateVisit();

  const handleSubmit = async (data: {
    type: "vaccination" | "checkup" | "emergency" | "other";
    title: string;
    notes: string;
    scheduledDate: Date;
    reminderDays: number;
  }) => {
    if (!id) return;
    await update(id, {
      type: data.type,
      title: data.title,
      notes: data.notes || undefined,
      scheduledDate: data.scheduledDate,
      reminderDays: data.reminderDays,
    });
    router.back();
  };

  if (isLoading || !visit) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Visit" }} />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Edit Visit" }} />
      <VisitForm
        initialData={visit}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
