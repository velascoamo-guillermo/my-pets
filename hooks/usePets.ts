import {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
} from "@/db/repositories/pets";
import { queryKeys } from "@/lib/queryKeys";
import type { NewPet } from "@/db/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function usePets() {
  return useQuery({
    queryKey: queryKeys.pets.all,
    queryFn: getAllPets,
  });
}

export function usePet(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.pets.detail(id!),
    queryFn: () => getPetById(id!),
    enabled: !!id,
  });
}

export function useCreatePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Omit<NewPet, "id" | "createdAt" | "updatedAt" | "syncStatus">,
    ) => createPet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pets.all });
    },
  });
}

export function useUpdatePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<NewPet, "id" | "createdAt">>;
    }) => updatePet(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pets.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pets.detail(variables.id),
      });
    },
  });
}

export function useDeletePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pets.all });
    },
  });
}
