import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { Pet } from "@/db/schema";

type PetCardProps = {
  pet: Pet;
  onPress: () => void;
};

export function PetCard({ pet, onPress }: PetCardProps) {
  const speciesIcon = pet.species === "dog" ? "🐕" : "🐈";

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {pet.imageUri ? (
        <Image source={{ uri: pet.imageUri }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="paw" size={40} color="#ccc" />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{pet.name}</Text>
        <Text style={styles.species}>
          {speciesIcon} {pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
          {pet.breed ? ` • ${pet.breed}` : ""}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.7,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  species: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
});
