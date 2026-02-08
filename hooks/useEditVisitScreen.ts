import { useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVisit, useUpdateVisit } from "@/hooks/useVisits";
import { rescheduleNotificationForVisit } from "@/hooks/useNotifications";
import type { VisitFormData } from "@/components/VisitForm";

export function useEditVisitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: visit, isLoading } = useVisit(id);
  const updateVisitMutation = useUpdateVisit();

  const handleSubmit = useCallback(
    async (data: VisitFormData) => {
      if (!id || !visit) return;
      const updates = {
        type: data.type,
        title: data.title,
        notes: data.notes || undefined,
        scheduledDate: data.scheduledDate,
        reminderDays: data.reminderDays,
      };
      await updateVisitMutation.mutateAsync({ id, data: updates });
      await rescheduleNotificationForVisit(id, updates, visit);
      router.back();
    },
    [id, visit, updateVisitMutation, router],
  );

  return { visit, isLoading, handleSubmit };
}
