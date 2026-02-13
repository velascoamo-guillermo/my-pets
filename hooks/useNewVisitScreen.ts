import { useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCreateVisit } from "@/hooks/useVisits";
import { scheduleNotificationForVisit } from "@/hooks/useNotifications";
import type { VisitFormData } from "@/lib/schemas/visitForm";

export function useNewVisitScreen() {
  const router = useRouter();
  const { id: petId } = useLocalSearchParams<{ id: string }>();
  const createVisitMutation = useCreateVisit();

  const handleSubmit = useCallback(
    async (data: VisitFormData) => {
      if (!petId) return;
      const visit = await createVisitMutation.mutateAsync({
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
    },
    [petId, createVisitMutation, router],
  );

  return { handleSubmit };
}
