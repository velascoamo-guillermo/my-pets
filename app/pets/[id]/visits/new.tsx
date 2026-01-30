import { VisitForm, type VisitFormData } from "@/components/VisitForm";
import { scheduleNotificationForVisit } from "@/hooks/useNotifications";
import { useCreateVisit } from "@/hooks/useVisits";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

export default function NewVisitScreen() {
  const router = useRouter();
  const { id: petId } = useLocalSearchParams<{ id: string }>();
  const { create } = useCreateVisit();

  const handleSubmit = async (data: VisitFormData) => {
    if (!petId) return;
    const visit = await create({
      petId,
      type: data.type,
      title: data.title,
      notes: data.notes || undefined,
      scheduledDate: data.scheduledDate,
      reminderDays: data.reminderDays,
      completed: false,
    });

    if (visit && data.reminderDays > 0) {
      await scheduleNotificationForVisit(visit);
    }

    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: "Schedule Visit" }} />
      <VisitForm onSubmit={handleSubmit} submitLabel="Schedule Visit" />
    </>
  );
}
