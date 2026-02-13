import { useCallback } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { cancelNotificationForVisit } from "@/hooks/useNotifications";
import { usePet } from "@/hooks/usePets";
import {
  useVisit,
  useMarkVisitComplete,
  useDeleteVisit,
} from "@/hooks/useVisits";

export function useVisitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: visit, isLoading: isVisitLoading } = useVisit(id);
  const { data: pet } = usePet(visit?.petId);

  const markCompleteMutation = useMarkVisitComplete();
  const deleteVisitMutation = useDeleteVisit();

  const handleEdit = useCallback(() => {
    router.push(`/visits/${id}/edit`);
  }, [id, router]);

  const handleComplete = useCallback(async () => {
    if (!visit) return;
    await cancelNotificationForVisit(visit);
    await markCompleteMutation.mutateAsync(visit.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [visit, markCompleteMutation]);

  const handleDelete = useCallback(() => {
    if (!visit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Visit",
      `Are you sure you want to delete "${visit.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await cancelNotificationForVisit(visit);
            await deleteVisitMutation.mutateAsync(visit.id);
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
            router.back();
          },
        },
      ],
    );
  }, [visit, deleteVisitMutation, router]);

  const handlePetPress = useCallback(() => {
    if (!visit?.petId) return;
    router.push(`/pets/${visit.petId}`);
  }, [visit?.petId, router]);

  return {
    visit,
    pet,
    isLoading: isVisitLoading,
    handleEdit,
    handleComplete,
    handleDelete,
    handlePetPress,
  };
}
