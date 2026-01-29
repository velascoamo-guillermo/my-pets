import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { usePet, useUpdatePet } from "@/hooks/usePets";
import { PetForm } from "@/components/PetForm";

export default function EditPetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pet, isLoading } = usePet(id);
  const { update } = useUpdatePet();

  const handleSubmit = async (data: {
    name: string;
    species: "dog" | "cat";
    breed: string;
    birthDate: Date | null;
    imageUri: string | null;
  }) => {
    if (!id) return;
    await update(id, {
      name: data.name,
      species: data.species,
      breed: data.breed || undefined,
      birthDate: data.birthDate ?? undefined,
      imageUri: data.imageUri ?? undefined,
    });
    router.back();
  };

  if (isLoading || !pet) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Pet" }} />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `Edit ${pet.name}` }} />
      <PetForm initialData={pet} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
