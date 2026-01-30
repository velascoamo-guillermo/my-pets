import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  useColorScheme,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { Pet } from "@/db/schema";

const colors = {
  light: {
    background: "#ffffff",
    text: "#333",
    textSecondary: "#666",
    textTertiary: "#999",
    tint: "#007AFF",
    tintBackground: "#F0F8FF",
    inputBorder: "#ddd",
    inputBackground: "#ffffff",
    placeholderBackground: "#f0f0f0",
  },
  dark: {
    background: "#000000",
    text: "#ffffff",
    textSecondary: "#aaaaaa",
    textTertiary: "#777",
    tint: "#0A84FF",
    tintBackground: "#1a3a5c",
    inputBorder: "#333",
    inputBackground: "#1c1c1e",
    placeholderBackground: "#2c2c2e",
  },
};

type PetFormData = {
  name: string;
  species: "dog" | "cat";
  birthDate: Date | null;
  imageUri: string | null;
  vetName: string;
  vetPhone: string;
  vetAddress: string;
};

type PetFormProps = {
  initialData?: Pet;
  onSubmit: (data: PetFormData) => Promise<void>;
  submitLabel: string;
};

export function PetForm({ initialData, onSubmit, submitLabel }: PetFormProps) {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const [name, setName] = useState(initialData?.name ?? "");
  const [species, setSpecies] = useState<"dog" | "cat">(
    initialData?.species ?? "dog"
  );

  const [birthDate, setBirthDate] = useState<Date | null>(
    initialData?.birthDate ?? null
  );
  const [imageUri, setImageUri] = useState<string | null>(
    initialData?.imageUri ?? null
  );
  const [vetName, setVetName] = useState(initialData?.vetName ?? "");
  const [vetPhone, setVetPhone] = useState(initialData?.vetPhone ?? "");
  const [vetAddress, setVetAddress] = useState(initialData?.vetAddress ?? "");
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

        birthDate,
        imageUri,
        vetName: vetName.trim(),
        vetPhone: vetPhone.trim(),
        vetAddress: vetAddress.trim(),
      });
    } catch {
      Alert.alert("Error", "Failed to save pet. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Pressable style={styles.imageContainer} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: theme.placeholderBackground }]}>
            <Ionicons name="camera" size={40} color={theme.textTertiary} />
            <Text style={[styles.imagePlaceholderText, { color: theme.textTertiary }]}>Add Photo</Text>
          </View>
        )}
      </Pressable>

      <Text style={[styles.label, { color: theme.text }]}>Name *</Text>
      <TextInput
        style={[styles.input, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground, color: theme.text }]}
        value={name}
        onChangeText={setName}
        placeholder="Enter pet name"
        placeholderTextColor={theme.textTertiary}
        autoCapitalize="words"
      />

      <Text style={[styles.label, { color: theme.text }]}>Species *</Text>
      <View style={styles.speciesContainer}>
        <Pressable
          style={[
            styles.speciesButton,
            { borderColor: theme.inputBorder },
            species === "dog" && { borderColor: theme.tint, backgroundColor: theme.tintBackground },
          ]}
          onPress={() => setSpecies("dog")}
        >
          <Text style={styles.speciesEmoji}>🐕</Text>
          <Text
            style={[
              styles.speciesText,
              { color: theme.textSecondary },
              species === "dog" && { color: theme.tint, fontWeight: "600" },
            ]}
          >
            Dog
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.speciesButton,
            { borderColor: theme.inputBorder },
            species === "cat" && { borderColor: theme.tint, backgroundColor: theme.tintBackground },
          ]}
          onPress={() => setSpecies("cat")}
        >
          <Text style={styles.speciesEmoji}>🐈</Text>
          <Text
            style={[
              styles.speciesText,
              { color: theme.textSecondary },
              species === "cat" && { color: theme.tint, fontWeight: "600" },
            ]}
          >
            Cat
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.label, { color: theme.text }]}>Birth Date</Text>
      <Pressable
        style={[styles.dateButton, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={birthDate ? [styles.dateText, { color: theme.text }] : [styles.datePlaceholder, { color: theme.textTertiary }]}>
          {birthDate ? birthDate.toLocaleDateString() : "Select date (optional)"}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
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

      <View style={styles.vetDivider} />
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Veterinarian</Text>

      <Text style={[styles.label, { color: theme.text }]}>Vet Name</Text>
      <TextInput
        style={[styles.input, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground, color: theme.text }]}
        value={vetName}
        onChangeText={setVetName}
        placeholder="Enter vet name (optional)"
        placeholderTextColor={theme.textTertiary}
        autoCapitalize="words"
      />

      <Text style={[styles.label, { color: theme.text }]}>Phone Number</Text>
      <TextInput
        style={[styles.input, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground, color: theme.text }]}
        value={vetPhone}
        onChangeText={setVetPhone}
        placeholder="Enter phone number (optional)"
        placeholderTextColor={theme.textTertiary}
        keyboardType="phone-pad"
      />

      <Text style={[styles.label, { color: theme.text }]}>Address</Text>
      <TextInput
        style={[styles.input, styles.textArea, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground, color: theme.text }]}
        value={vetAddress}
        onChangeText={setVetAddress}
        placeholder="Enter address (optional)"
        placeholderTextColor={theme.textTertiary}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <Pressable
        style={[styles.submitButton, { backgroundColor: theme.tint }, isSubmitting && styles.submitButtonDisabled]}
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
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    fontSize: 12,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
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
    borderRadius: 8,
    gap: 8,
  },
  speciesEmoji: {
    fontSize: 24,
  },
  speciesText: {
    fontSize: 16,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
  },
  datePlaceholder: {
    fontSize: 16,
  },
  vetDivider: {
    height: 1,
    backgroundColor: "#ddd",
    marginTop: 32,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 4,
  },
  textArea: {
    height: 80,
  },
  submitButton: {
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
