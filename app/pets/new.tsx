import { PetForm, type PetFormData } from "@/components/PetForm";
import { useCreatePet } from "@/hooks/usePets";
import { Stack, useRouter } from "expo-router";

export default function NewPetScreen() {
  const router = useRouter();
  const { create } = useCreatePet();

  const handleSubmit = async (data: PetFormData) => {
    await create({
      name: data.name,
      species: data.species,
      birthDate: data.birthDate ?? undefined,
      imageUri: data.imageUri ?? undefined,
      vetName: data.vetName || undefined,
      vetPhone: data.vetPhone || undefined,
      vetAddress: data.vetAddress || undefined,
    });
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: "Add Pet" }} />
      <PetForm onSubmit={handleSubmit} submitLabel="Add Pet" />
    </>
  );
}
