import {
  getAnalysisByFileId,
  getAnalysesByPetId,
  getAnalysisById,
  createFileAnalysis,
  updateFileAnalysis,
} from "@/db/repositories/fileAnalyses";
import { queryKeys } from "@/lib/queryKeys";
import { analyzePdfFile } from "@/services/analysis";
import { syncWithSupabase } from "@/services/sync";
import * as Sentry from "@sentry/react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useAnalysisByFile(fileId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.analyses.byFile(fileId!),
    queryFn: async () => {
      const result = await getAnalysisByFileId(fileId!);
      console.log(`[Analysis] fileId=${fileId} →`, result?.status ?? "none");
      return result;
    },
    enabled: !!fileId,
  });
}

export function useAnalysesByPet(petId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.analyses.byPet(petId!),
    queryFn: () => getAnalysesByPetId(petId!),
    enabled: !!petId,
  });
}

export function useAnalysis(analysisId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.analyses.detail(analysisId!),
    queryFn: () => getAnalysisById(analysisId!),
    enabled: !!analysisId,
  });
}

export function useAnalyzePdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fileId,
      fileUrl,
      petId,
      visitId,
      petSpecies,
      petAge,
      onPendingCreated,
    }: {
      fileId: string;
      fileUrl: string;
      petId: string;
      visitId?: string;
      petSpecies?: "dog" | "cat";
      petAge?: string;
      onPendingCreated?: (analysisId: string) => void;
    }) => {
      // Create pending analysis record locally
      const pendingAnalysis = await createFileAnalysis({
        fileId,
        petId,
        visitId: visitId ?? null,
        status: "pending",
        labValues: null,
        summary: null,
        interpretation: null,
        errorMessage: null,
        analyzedAt: null,
      });

      onPendingCreated?.(pendingAnalysis.id);

      try {
        // Update to processing
        await updateFileAnalysis(pendingAnalysis.id, { status: "processing" });

        // Call edge function (each analysis is independent — comparison is done client-side)
        const response = await analyzePdfFile({
          fileUrl,
          fileId,
          petId,
          visitId,
          petSpecies,
          petAge,
        });

        if (!response.success) {
          await updateFileAnalysis(pendingAnalysis.id, {
            status: "failed",
            errorMessage: response.error ?? "Analysis failed",
          });
          throw new Error(response.error ?? "Analysis failed");
        }

        // Update with results
        await updateFileAnalysis(pendingAnalysis.id, {
          status: "completed",
          labValues: JSON.stringify(response.labValues),
          summary: response.summary ?? null,
          interpretation: response.interpretation ?? null,
          analyzedAt: new Date(),
        });

        syncWithSupabase().catch((err) => Sentry.captureException(err));

        return pendingAnalysis.id;
      } catch (err) {
        // If not already marked as failed, mark it
        await updateFileAnalysis(pendingAnalysis.id, {
          status: "failed",
          errorMessage:
            err instanceof Error ? err.message : "Unknown error",
        });
        throw err;
      }
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.analyses.byFile(variables.fileId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.analyses.byPet(variables.petId),
      });
    },
  });
}
