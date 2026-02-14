import { useCallback, useMemo } from "react";
import { Alert } from "react-native";
import * as Sentry from "@sentry/react-native";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File as FSFile, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAnalyzePdf } from "@/hooks/useFileAnalyses";
import { cancelNotificationForVisit } from "@/hooks/useNotifications";
import {
  useAddPetFile,
  useDeletePetFile,
  useFilesByPet,
} from "@/hooks/usePetFiles";
import { useDeletePet, usePet } from "@/hooks/usePets";
import {
  useDeleteVisit,
  useMarkVisitComplete,
  useVisitsByPet,
} from "@/hooks/useVisits";
import { calculateAge } from "@/lib/petAge";
import { syncWithSupabase } from "@/services/sync";

export function usePetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: pet, isLoading: isPetLoading } = usePet(id);
  const { data: visits = [], isLoading: isVisitsLoading } = useVisitsByPet(id);
  const { data: files = [], isLoading: isFilesLoading } = useFilesByPet(id);

  const deletePetMutation = useDeletePet();
  const markCompleteMutation = useMarkVisitComplete();
  const deleteVisitMutation = useDeleteVisit();
  const addFileMutation = useAddPetFile();
  const deleteFileMutation = useDeletePetFile();
  const analyzePdfMutation = useAnalyzePdf();

  const upcomingVisits = useMemo(
    () =>
      visits.filter(
        (v) => !v.completed && new Date(v.scheduledDate) >= new Date(),
      ),
    [visits],
  );

  const pastVisits = useMemo(
    () =>
      visits.filter(
        (v) => v.completed || new Date(v.scheduledDate) < new Date(),
      ),
    [visits],
  );

  const age = useMemo(() => {
    if (!pet?.birthDate) return null;
    return calculateAge(pet.birthDate);
  }, [pet?.birthDate]);

  const handleDelete = useCallback(() => {
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
            await deletePetMutation.mutateAsync(id);
            router.back();
          },
        },
      ],
    );
  }, [id, pet?.name, deletePetMutation, router]);

  const handlePickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const fileName = `${Date.now()}_${asset.name}`;
      const destDir = new Directory(Paths.document, "pet-files");
      if (!destDir.exists) {
        destDir.create({ intermediates: true });
      }
      const sourceFile = new FSFile(asset.uri);
      const destFile = new FSFile(destDir, fileName);
      sourceFile.copy(destFile);

      await addFileMutation.mutateAsync({
        petId: id!,
        name: asset.name,
        uri: destFile.uri,
        fileType: asset.mimeType ?? "application/octet-stream",
        fileSize: asset.size ?? 0,
      });

      syncWithSupabase().catch((err) => Sentry.captureException(err));
    } catch (err) {
      Sentry.captureException(err);
      Alert.alert("Error", "Failed to add file. Please try again.");
    }
  }, [id, addFileMutation]);

  const handleDeleteFile = useCallback(
    async (fileId: string, fileUri: string) => {
      await deleteFileMutation.mutateAsync({ id: fileId, fileUri, petId: id! });
    },
    [id, deleteFileMutation],
  );

  const handleDeleteVisit = useCallback(
    (visitId: string, close?: () => void) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const visit = visits.find((v) => v.id === visitId);
      Alert.alert(
        "Delete Visit",
        `Are you sure you want to delete "${visit?.title}"?`,
        [
          { text: "Cancel", style: "cancel", onPress: close },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await deleteVisitMutation.mutateAsync(visitId);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            },
          },
        ],
      );
    },
    [visits, deleteVisitMutation],
  );

  const handleCompleteVisit = useCallback(
    async (visitId: string) => {
      const visit = visits.find((v) => v.id === visitId);
      if (visit) {
        await cancelNotificationForVisit(visit);
      }
      await markCompleteMutation.mutateAsync(visitId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [visits, markCompleteMutation],
  );

  const handleEditPress = useCallback(() => {
    router.push(`/pets/${id}/edit`);
  }, [id, router]);

  const handleAddVisitPress = useCallback(() => {
    router.push(`/pets/${id}/visits/new`);
  }, [id, router]);

  const handleVisitPress = useCallback(
    (visitId: string) => {
      router.push(`/visits/${visitId}`);
    },
    [router],
  );

  const handleAnalyzeFile = useCallback(
    async (fileId: string, fileUrl: string) => {
      if (!pet) return;
      try {
        const analysisId = await analyzePdfMutation.mutateAsync({
          fileId,
          fileUrl,
          petId: id!,
          petSpecies: pet.species,
          petAge: age ?? undefined,
        });
        router.push(`/analyses/${analysisId}`);
      } catch (err) {
        Sentry.captureException(err);
        Alert.alert(
          "Analysis Failed",
          err instanceof Error ? err.message : "Please try again"
        );
      }
    },
    [pet, id, age, analyzePdfMutation, router]
  );

  return {
    pet,
    isPetLoading,
    isVisitsLoading,
    files,
    isFilesLoading,
    analyzingFileId: analyzePdfMutation.isPending
      ? analyzePdfMutation.variables?.fileId ?? null
      : null,
    upcomingVisits,
    pastVisits,
    age,
    handleDelete,
    handlePickFile,
    handleDeleteFile,
    handleAnalyzeFile,
    handleDeleteVisit,
    handleCompleteVisit,
    handleEditPress,
    handleAddVisitPress,
    handleVisitPress,
  };
}
