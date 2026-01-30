import { View, ActivityIndicator, StyleSheet, useColorScheme } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useVisit, useUpdateVisit } from "@/hooks/useVisits";
import { rescheduleNotificationForVisit } from "@/hooks/useNotifications";
import { VisitForm, type VisitFormData } from "@/components/VisitForm";

const colors = {
  light: {
    background: "#ffffff",
    tint: "#007AFF",
  },
  dark: {
    background: "#000000",
    tint: "#0A84FF",
  },
};

export default function EditVisitScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { visit, isLoading } = useVisit(id);
  const { update } = useUpdateVisit();

  const handleSubmit = async (data: VisitFormData) => {
    if (!id || !visit) return;

    const updates = {
      type: data.type,
      title: data.title,
      notes: data.notes || undefined,
      scheduledDate: data.scheduledDate,
      reminderDays: data.reminderDays,
    };

    await update(id, updates);
    await rescheduleNotificationForVisit(id, updates, visit);
    router.back();
  };

  if (isLoading || !visit) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Visit" }} />
        <View style={[styles.loading, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.tint} />
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
