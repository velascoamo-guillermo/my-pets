import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useCreateVisit } from "@/hooks/useVisits";
import { scheduleNotificationForVisit } from "@/hooks/useNotifications";
import { VisitForm } from "@/components/VisitForm";

export default function NewVisitScreen() {
  const router = useRouter();
  const { id: petId } = useLocalSearchParams<{ id: string }>();
  const { create } = useCreateVisit();

  const handleSubmit = async (data: {
    type: "vaccination" | "checkup" | "emergency" | "other";
    title: string;
    notes: string;
    scheduledDate: Date;
    reminderDays: number;
  }) => {
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
