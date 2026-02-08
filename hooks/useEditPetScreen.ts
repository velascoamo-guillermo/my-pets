import { useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePet, useUpdatePet } from "@/hooks/usePets";
import type { PetFormData } from "@/components/PetForm";

export function useEditPetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pet, isLoading } = usePet(id);
  const updatePetMutation = useUpdatePet();

  const handleSubmit = useCallback(
    async (data: PetFormData) => {
      if (!id) return;
      await updatePetMutation.mutateAsync({
        id,
        data: {
          name: data.name,
          species: data.species,
          birthDate: data.birthDate ?? undefined,
          imageUri: data.imageUri ?? undefined,
          vetName: data.vetName || undefined,
          vetPhone: data.vetPhone || undefined,
          vetAddress: data.vetAddress || undefined,
        },
      });
      router.back();
    },
    [id, updatePetMutation, router],
  );

  return { pet, isLoading, handleSubmit };
}
