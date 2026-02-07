import type { Pet } from "@/db/schema";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import { Directory, File as FSFile, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

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
    error: "#FF3B30",
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
    error: "#FF453A",
  },
};

const petFormSchema = z.object({
  name: z.string().min(1, "Please enter a name for your pet"),
  species: z.enum(["dog", "cat"]),
  birthDate: z.date().nullable(),
  imageUri: z.string().nullable(),
  vetName: z.string(),
  vetPhone: z.string(),
  vetAddress: z.string(),
});

export type PetFormData = z.infer<typeof petFormSchema>;

type PetFormProps = {
  initialData?: Pet;
  onSubmit: (data: PetFormData) => Promise<void>;
  submitLabel: string;
};

export function PetForm({ initialData, onSubmit, submitLabel }: PetFormProps) {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const safeArea = useSafeAreaInsets();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PetFormData>({
    resolver: zodResolver(petFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      species: initialData?.species ?? "dog",
      birthDate: initialData?.birthDate ?? null,
      imageUri: initialData?.imageUri ?? null,
      vetName: initialData?.vetName ?? "",
      vetPhone: initialData?.vetPhone ?? "",
      vetAddress: initialData?.vetAddress ?? "",
    },
  });

  const onFormSubmit = async (data: PetFormData) => {
    try {
      await onSubmit({
        ...data,
        name: data.name.trim(),
        vetName: data.vetName.trim(),
        vetPhone: data.vetPhone.trim(),
        vetAddress: data.vetAddress.trim(),
      });
    } catch {
      Alert.alert("Error", "Failed to save pet. Please try again.");
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: safeArea.bottom },
      ]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Controller
        control={control}
        name="imageUri"
        render={({ field: { onChange, value } }) => (
          <Pressable
            style={styles.imageContainer}
            onPress={async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled) {
                const tempUri = result.assets[0].uri;
                const fileName = tempUri.split("/").pop()!;
                const dir = new Directory(Paths.document, "pet-images");
                if (!dir.exists) {
                  dir.create({ intermediates: true });
                }

                const destination = new FSFile(dir, fileName);
                const tempFile = new FSFile(tempUri);
                tempFile.copy(destination);

                onChange(destination.uri);
              }
            }}
          >
            {value ? (
              <Image source={{ uri: value }} style={styles.image} />
            ) : (
              <View
                style={[
                  styles.imagePlaceholder,
                  { backgroundColor: theme.placeholderBackground },
                ]}
              >
                <Ionicons
                  name="camera"
                  size={40}
                  color={theme.textTertiary}
                />
                <Text
                  style={[
                    styles.imagePlaceholderText,
                    { color: theme.textTertiary },
                  ]}
                >
                  Add Photo
                </Text>
              </View>
            )}
          </Pressable>
        )}
      />

      <Text style={[styles.label, { color: theme.text }]}>Name *</Text>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[
              styles.input,
              {
                borderColor: errors.name ? theme.error : theme.inputBorder,
                backgroundColor: theme.inputBackground,
                color: theme.text,
              },
            ]}
            value={value}
            onChangeText={onChange}
            placeholder="Enter pet name"
            placeholderTextColor={theme.textTertiary}
            autoCapitalize="words"
          />
        )}
      />
      {errors.name && (
        <Text style={[styles.errorText, { color: theme.error }]}>
          {errors.name.message}
        </Text>
      )}

      <Text style={[styles.label, { color: theme.text }]}>Species *</Text>
      <Controller
        control={control}
        name="species"
        render={({ field: { onChange, value } }) => (
          <View style={styles.speciesContainer}>
            <Pressable
              style={[
                styles.speciesButton,
                { borderColor: theme.inputBorder },
                value === "dog" && {
                  borderColor: theme.tint,
                  backgroundColor: theme.tintBackground,
                },
              ]}
              onPress={() => onChange("dog")}
            >
              <Text style={styles.speciesEmoji}>🐕</Text>
              <Text
                style={[
                  styles.speciesText,
                  { color: theme.textSecondary },
                  value === "dog" && { color: theme.tint, fontWeight: "600" },
                ]}
              >
                Dog
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.speciesButton,
                { borderColor: theme.inputBorder },
                value === "cat" && {
                  borderColor: theme.tint,
                  backgroundColor: theme.tintBackground,
                },
              ]}
              onPress={() => onChange("cat")}
            >
              <Text style={styles.speciesEmoji}>🐈</Text>
              <Text
                style={[
                  styles.speciesText,
                  { color: theme.textSecondary },
                  value === "cat" && { color: theme.tint, fontWeight: "600" },
                ]}
              >
                Cat
              </Text>
            </Pressable>
          </View>
        )}
      />

      <Text style={[styles.label, { color: theme.text }]}>Birth Date</Text>
      <Controller
        control={control}
        name="birthDate"
        render={({ field: { onChange, value } }) => (
          <>
            <Pressable
              style={[
                styles.dateButton,
                {
                  borderColor: theme.inputBorder,
                  backgroundColor: theme.inputBackground,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={
                  value
                    ? [styles.dateText, { color: theme.text }]
                    : [styles.datePlaceholder, { color: theme.textTertiary }]
                }
              >
                {value
                  ? value.toLocaleDateString()
                  : "Select date (optional)"}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.textSecondary}
              />
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={value ?? new Date()}
                mode="date"
                maximumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (event.type === "set" && date) {
                    onChange(date);
                  }
                }}
              />
            )}
          </>
        )}
      />

      <View style={styles.vetDivider} />
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Veterinarian
      </Text>

      <Text style={[styles.label, { color: theme.text }]}>Vet Name</Text>
      <Controller
        control={control}
        name="vetName"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.inputBorder,
                backgroundColor: theme.inputBackground,
                color: theme.text,
              },
            ]}
            value={value}
            onChangeText={onChange}
            placeholder="Enter vet name (optional)"
            placeholderTextColor={theme.textTertiary}
            autoCapitalize="words"
          />
        )}
      />

      <Text style={[styles.label, { color: theme.text }]}>Phone Number</Text>
      <Controller
        control={control}
        name="vetPhone"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.inputBorder,
                backgroundColor: theme.inputBackground,
                color: theme.text,
              },
            ]}
            value={value}
            onChangeText={onChange}
            placeholder="Enter phone number (optional)"
            placeholderTextColor={theme.textTertiary}
            keyboardType="phone-pad"
          />
        )}
      />

      <Text style={[styles.label, { color: theme.text }]}>Address</Text>
      <Controller
        control={control}
        name="vetAddress"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                borderColor: theme.inputBorder,
                backgroundColor: theme.inputBackground,
                color: theme.text,
              },
            ]}
            value={value}
            onChangeText={onChange}
            placeholder="Enter address (optional)"
            placeholderTextColor={theme.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        )}
      />

      <Pressable
        style={[
          styles.submitButton,
          { backgroundColor: theme.tint },
          isSubmitting && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit(onFormSubmit)}
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
  errorText: {
    fontSize: 13,
    marginTop: 4,
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
