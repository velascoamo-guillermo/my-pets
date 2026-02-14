import { useCallback } from "react";
import { Alert } from "react-native";
import * as Sentry from "@sentry/react-native";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File as FSFile, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAnalyzePdf } from "@/hooks/useFileAnalyses";
import { cancelNotificationForVisit } from "@/hooks/useNotifications";
import { calculateAge } from "@/lib/petAge";
import {
  useAddPetFile,
  useDeletePetFile,
  useFilesByVisit,
} from "@/hooks/usePetFiles";
import { usePet } from "@/hooks/usePets";
import {
  useVisit,
  useMarkVisitComplete,
  useDeleteVisit,
} from "@/hooks/useVisits";
import { syncWithSupabase } from "@/services/sync";

export function useVisitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: visit, isLoading: isVisitLoading } = useVisit(id);
  const { data: pet } = usePet(visit?.petId);
  const { data: files = [], isLoading: isFilesLoading } = useFilesByVisit(id);

  const markCompleteMutation = useMarkVisitComplete();
  const deleteVisitMutation = useDeleteVisit();
  const addFileMutation = useAddPetFile();
  const deleteFileMutation = useDeletePetFile();
  const analyzePdfMutation = useAnalyzePdf();

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

  const handlePickFile = useCallback(async () => {
    if (!visit) return;
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
        petId: visit.petId,
        visitId: id,
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
  }, [visit, id, addFileMutation]);

  const handleDeleteFile = useCallback(
    async (fileId: string, fileUri: string) => {
      if (!visit) return;
      await deleteFileMutation.mutateAsync({
        id: fileId,
        fileUri,
        petId: visit.petId,
        visitId: id,
      });
    },
    [visit, id, deleteFileMutation],
  );

  const handleAnalyzeFile = useCallback(
    async (fileId: string, fileUrl: string) => {
      if (!visit) return;
      try {
        const petAge = pet?.birthDate ? calculateAge(pet.birthDate) : undefined;
        const analysisId = await analyzePdfMutation.mutateAsync({
          fileId,
          fileUrl,
          petId: visit.petId,
          visitId: id,
          petSpecies: pet?.species,
          petAge,
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
    [visit, id, pet?.species, pet?.birthDate, analyzePdfMutation, router]
  );

  return {
    visit,
    pet,
    files,
    isLoading: isVisitLoading,
    isFilesLoading,
    analyzingFileId: analyzePdfMutation.isPending
      ? analyzePdfMutation.variables?.fileId ?? null
      : null,
    handleEdit,
    handleComplete,
    handleDelete,
    handlePetPress,
    handlePickFile,
    handleDeleteFile,
    handleAnalyzeFile,
  };
}
