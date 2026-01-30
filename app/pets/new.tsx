import { Stack, useRouter } from "expo-router";
import { useCreatePet } from "@/hooks/usePets";
import { PetForm } from "@/components/PetForm";

export default function NewPetScreen() {
  const router = useRouter();
  const { create } = useCreatePet();

  const handleSubmit = async (data: {
    name: string;
    species: "dog" | "cat";
    birthDate: Date | null;
    imageUri: string | null;
    vetName: string;
    vetPhone: string;
    vetAddress: string;
  }) => {
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
