import { PetForm } from "@/components/PetForm";
import { useNewPetScreen } from "@/hooks/useNewPetScreen";
import { Stack } from "expo-router";

export default function NewPetScreen() {
  const { handleSubmit } = useNewPetScreen();

  return (
    <>
      <Stack.Screen options={{ title: "Add Pet" }} />
      <PetForm onSubmit={handleSubmit} submitLabel="Add Pet" />
    </>
  );
}
