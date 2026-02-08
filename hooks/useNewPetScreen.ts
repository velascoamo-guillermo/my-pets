import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useCreatePet } from "@/hooks/usePets";
import type { PetFormData } from "@/components/PetForm";

export function useNewPetScreen() {
  const router = useRouter();
  const createPetMutation = useCreatePet();

  const handleSubmit = useCallback(
    async (data: PetFormData) => {
      await createPetMutation.mutateAsync({
        name: data.name,
        species: data.species,
        birthDate: data.birthDate ?? undefined,
        imageUri: data.imageUri ?? undefined,
        vetName: data.vetName || undefined,
        vetPhone: data.vetPhone || undefined,
        vetAddress: data.vetAddress || undefined,
      });
      router.back();
    },
    [createPetMutation, router],
  );

  return { handleSubmit };
}
