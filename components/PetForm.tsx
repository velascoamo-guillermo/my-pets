import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { Pet } from "@/db/schema";

type PetFormData = {
  name: string;
  species: "dog" | "cat";
  breed: string;
  birthDate: Date | null;
  imageUri: string | null;
};

type PetFormProps = {
  initialData?: Pet;
  onSubmit: (data: PetFormData) => Promise<void>;
  submitLabel: string;
};

export function PetForm({ initialData, onSubmit, submitLabel }: PetFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [species, setSpecies] = useState<"dog" | "cat">(
    initialData?.species ?? "dog"
  );
  const [breed, setBreed] = useState(initialData?.breed ?? "");
  const [birthDate, setBirthDate] = useState<Date | null>(
    initialData?.birthDate ?? null
  );
  const [imageUri, setImageUri] = useState<string | null>(
    initialData?.imageUri ?? null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a name for your pet");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        species,
        breed: breed.trim(),
        birthDate,
        imageUri,
      });
    } catch {
      Alert.alert("Error", "Failed to save pet. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.imageContainer} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera" size={40} color="#999" />
            <Text style={styles.imagePlaceholderText}>Add Photo</Text>
          </View>
        )}
      </Pressable>

      <Text style={styles.label}>Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter pet name"
        autoCapitalize="words"
      />

      <Text style={styles.label}>Species *</Text>
      <View style={styles.speciesContainer}>
        <Pressable
          style={[
            styles.speciesButton,
            species === "dog" && styles.speciesButtonActive,
          ]}
          onPress={() => setSpecies("dog")}
        >
          <Text style={styles.speciesEmoji}>🐕</Text>
          <Text
            style={[
              styles.speciesText,
              species === "dog" && styles.speciesTextActive,
            ]}
          >
            Dog
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.speciesButton,
            species === "cat" && styles.speciesButtonActive,
          ]}
          onPress={() => setSpecies("cat")}
        >
          <Text style={styles.speciesEmoji}>🐈</Text>
          <Text
            style={[
              styles.speciesText,
              species === "cat" && styles.speciesTextActive,
            ]}
          >
            Cat
          </Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Breed</Text>
      <TextInput
        style={styles.input}
        value={breed}
        onChangeText={setBreed}
        placeholder="Enter breed (optional)"
        autoCapitalize="words"
      />

      <Text style={styles.label}>Birth Date</Text>
      <Pressable
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={birthDate ? styles.dateText : styles.datePlaceholder}>
          {birthDate ? birthDate.toLocaleDateString() : "Select date (optional)"}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#666" />
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={birthDate ?? new Date()}
          mode="date"
          maximumDate={new Date()}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (event.type === "set" && date) {
              setBirthDate(date);
            }
          }}
        />
      )}

      <Pressable
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  imageContainer: {
    alignSelf: "center",
    marginBottom: 24,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  speciesContainer: {
    flexDirection: "row",
    gap: 12,
  },
  speciesButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 8,
    gap: 8,
  },
  speciesButtonActive: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F8FF",
  },
  speciesEmoji: {
    fontSize: 24,
  },
  speciesText: {
    fontSize: 16,
    color: "#666",
  },
  speciesTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  datePlaceholder: {
    fontSize: 16,
    color: "#999",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
