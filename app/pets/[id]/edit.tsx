import { PetForm } from "@/components/PetForm";
import { useEditPetScreen } from "@/hooks/useEditPetScreen";
import { Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function EditPetScreen() {
  const { pet, isLoading, handleSubmit } = useEditPetScreen();

  if (isLoading || !pet) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Pet" }} />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#D4517A" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `Edit ${pet.name}` }} />
      <PetForm
        initialData={pet}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
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
