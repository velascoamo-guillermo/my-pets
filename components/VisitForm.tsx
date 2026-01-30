import type { VetVisit } from "@/db/schema";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
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
  },
};

const visitFormSchema = z.object({
  type: z.enum(["vaccination", "checkup", "emergency", "other"]),
  title: z.string().min(1, "Please enter a title for this visit"),
  notes: z.string(),
  scheduledDate: z.date(),
  reminderDays: z.number(),
});

export type VisitFormData = z.infer<typeof visitFormSchema>;

type VisitFormProps = {
  initialData?: VetVisit;
  onSubmit: (data: VisitFormData) => Promise<void>;
  submitLabel: string;
};

const VISIT_TYPES: { value: VisitFormData["type"]; label: string; icon: string }[] = [
  { value: "vaccination", label: "Vaccination", icon: "medical" },
  { value: "checkup", label: "Checkup", icon: "fitness" },
  { value: "emergency", label: "Emergency", icon: "alert-circle" },
  { value: "other", label: "Other", icon: "ellipsis-horizontal" },
];

const REMINDER_OPTIONS = [
  { value: 0, label: "No reminder" },
  { value: 1, label: "1 day before" },
  { value: 3, label: "3 days before" },
  { value: 7, label: "1 week before" },
];

export function VisitForm({ initialData, onSubmit, submitLabel }: VisitFormProps) {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VisitFormData>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: {
      type: initialData?.type ?? "checkup",
      title: initialData?.title ?? "",
      notes: initialData?.notes ?? "",
      scheduledDate: initialData?.scheduledDate ?? new Date(),
      reminderDays: initialData?.reminderDays ?? 1,
    },
  });

  const onFormSubmit = async (data: VisitFormData) => {
    try {
      await onSubmit({
        ...data,
        title: data.title.trim(),
        notes: data.notes.trim(),
      });
    } catch {
      Alert.alert("Error", "Failed to save visit. Please try again.");
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.label, { color: theme.text }]}>Visit Type</Text>
      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, value } }) => (
          <View style={styles.typeContainer}>
            {VISIT_TYPES.map((item) => (
              <Pressable
                key={item.value}
                style={[
                  styles.typeButton,
                  { borderColor: theme.inputBorder },
                  value === item.value && { borderColor: theme.tint, backgroundColor: theme.tintBackground },
                ]}
                onPress={() => onChange(item.value)}
              >
                <Ionicons
                  name={item.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={value === item.value ? theme.tint : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.typeText,
                    { color: theme.textSecondary },
                    value === item.value && { color: theme.tint, fontWeight: "600" },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      />

      <Text style={[styles.label, { color: theme.text }]}>Title *</Text>
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[
              styles.input,
              {
                borderColor: errors.title ? theme.tint : theme.inputBorder,
                backgroundColor: theme.inputBackground,
                color: theme.text,
              },
            ]}
            value={value}
            onChangeText={onChange}
            placeholder="e.g., Annual vaccination, Dental checkup"
            placeholderTextColor={theme.textTertiary}
          />
        )}
      />
      {errors.title && (
        <Text style={[styles.errorText, { color: "#FF3B30" }]}>
          {errors.title.message}
        </Text>
      )}

      <Text style={[styles.label, { color: theme.text }]}>Date & Time</Text>
      <Controller
        control={control}
        name="scheduledDate"
        render={({ field: { onChange, value } }) => (
          <>
            <View style={styles.dateTimeRow}>
              <Pressable
                style={[styles.dateButton, styles.dateButtonHalf, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                <Text style={[styles.dateText, { color: theme.text }]}>
                  {value.toLocaleDateString()}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.dateButton, styles.dateButtonHalf, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
                <Text style={[styles.dateText, { color: theme.text }]}>
                  {value.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </Pressable>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={value}
                mode="date"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (event.type === "set" && date) {
                    onChange(date);
                  }
                }}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={value}
                mode="time"
                onChange={(event, date) => {
                  setShowTimePicker(false);
                  if (event.type === "set" && date) {
                    onChange(date);
                  }
                }}
              />
            )}
          </>
        )}
      />

      <Text style={[styles.label, { color: theme.text }]}>Reminder</Text>
      <Controller
        control={control}
        name="reminderDays"
        render={({ field: { onChange, value } }) => (
          <View style={styles.reminderContainer}>
            {REMINDER_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.reminderButton,
                  { borderColor: theme.inputBorder },
                  value === option.value && { borderColor: theme.tint, backgroundColor: theme.tintBackground },
                ]}
                onPress={() => onChange(option.value)}
              >
                <Text
                  style={[
                    styles.reminderText,
                    { color: theme.textSecondary },
                    value === option.value && { color: theme.tint, fontWeight: "500" },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      />

      <Text style={[styles.label, { color: theme.text }]}>Notes</Text>
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[styles.input, styles.textArea, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground, color: theme.text }]}
            value={value}
            onChangeText={onChange}
            placeholder="Add any notes about this visit (optional)"
            placeholderTextColor={theme.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        )}
      />

      <Pressable
        style={[styles.submitButton, { backgroundColor: theme.tint }, isSubmitting && styles.submitButtonDisabled]}
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
  textArea: {
    height: 100,
  },
  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeButton: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 2,
    borderRadius: 8,
    gap: 8,
  },
  typeText: {
    fontSize: 14,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  dateButtonHalf: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
  },
  reminderContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reminderButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 20,
  },
  reminderText: {
    fontSize: 14,
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
