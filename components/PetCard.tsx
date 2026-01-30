import { View, Text, StyleSheet, Pressable, useColorScheme } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { Pet } from "@/db/schema";

const colors = {
  light: {
    cardBackground: "#ffffff",
    text: "#333",
    textSecondary: "#666",
    placeholder: "#f0f0f0",
    placeholderIcon: "#ccc",
    chevron: "#999",
  },
  dark: {
    cardBackground: "#1c1c1e",
    text: "#ffffff",
    textSecondary: "#aaaaaa",
    placeholder: "#2c2c2e",
    placeholderIcon: "#555",
    chevron: "#666",
  },
};

type PetCardProps = {
  pet: Pet;
  onPress: () => void;
};

export function PetCard({ pet, onPress }: PetCardProps) {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const speciesIcon = pet.species === "dog" ? "🐕" : "🐈";

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { backgroundColor: theme.cardBackground }, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {pet.imageUri ? (
        <Image source={{ uri: pet.imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: theme.placeholder }]}>
          <Ionicons name="paw" size={40} color={theme.placeholderIcon} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text }]}>{pet.name}</Text>
        <Text style={[styles.species, { color: theme.textSecondary }]}>
          {speciesIcon} {pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  species: {
    fontSize: 14,
    marginTop: 2,
  },
});
