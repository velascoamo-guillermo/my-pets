import { Stack, useRouter } from "expo-router";
import { useCreatePet } from "@/hooks/usePets";
import { PetForm } from "@/components/PetForm";

export default function NewPetScreen() {
  const router = useRouter();
  const { create } = useCreatePet();

  const handleSubmit = async (data: {
    name: string;
    species: "dog" | "cat";
    breed: string;
    birthDate: Date | null;
    imageUri: string | null;
  }) => {
    await create({
      name: data.name,
      species: data.species,
      breed: data.breed || undefined,
      birthDate: data.birthDate ?? undefined,
      imageUri: data.imageUri ?? undefined,
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
