import {
  getFilesByPetId,
  createPetFile,
  deletePetFile,
} from "@/db/repositories/petFiles";
import { queryKeys } from "@/lib/queryKeys";
import type { NewPetFile } from "@/db/schema";
import { File as FSFile } from "expo-file-system";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useFilesByPet(petId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.files.byPet(petId!),
    queryFn: () => getFilesByPetId(petId!),
    enabled: !!petId,
  });
}

export function useAddPetFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<NewPetFile, "id" | "createdAt" | "syncStatus">) =>
      createPetFile(data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.files.byPet(variables.petId),
      });
    },
  });
}

export function useDeletePetFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      fileUri,
    }: {
      id: string;
      fileUri: string;
      petId: string;
    }) => {
      try {
        const file = new FSFile(fileUri);
        if (file.exists) {
          file.delete();
        }
      } catch {
        // File might already be gone
      }
      await deletePetFile(id);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.files.byPet(variables.petId),
      });
    },
  });
}
