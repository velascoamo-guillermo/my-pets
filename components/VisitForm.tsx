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
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { VetVisit } from "@/db/schema";

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

type VisitType = "vaccination" | "checkup" | "emergency" | "other";

type VisitFormData = {
  type: VisitType;
  title: string;
  notes: string;
  scheduledDate: Date;
  reminderDays: number;
};

type VisitFormProps = {
  initialData?: VetVisit;
  onSubmit: (data: VisitFormData) => Promise<void>;
  submitLabel: string;
};

const VISIT_TYPES: { value: VisitType; label: string; icon: string }[] = [
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
  const [type, setType] = useState<VisitType>(initialData?.type ?? "checkup");
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [scheduledDate, setScheduledDate] = useState<Date>(
    initialData?.scheduledDate ?? new Date()
  );
  const [reminderDays, setReminderDays] = useState(initialData?.reminderDays ?? 1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title for this visit");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        type,
        title: title.trim(),
        notes: notes.trim(),
        scheduledDate,
        reminderDays,
      });
    } catch {
      Alert.alert("Error", "Failed to save visit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.label, { color: theme.text }]}>Visit Type</Text>
      <View style={styles.typeContainer}>
        {VISIT_TYPES.map((item) => (
          <Pressable
            key={item.value}
            style={[
              styles.typeButton,
              { borderColor: theme.inputBorder },
              type === item.value && { borderColor: theme.tint, backgroundColor: theme.tintBackground },
            ]}
            onPress={() => setType(item.value)}
          >
            <Ionicons
              name={item.icon as keyof typeof Ionicons.glyphMap}
              size={24}
              color={type === item.value ? theme.tint : theme.textSecondary}
            />
            <Text
              style={[
                styles.typeText,
                { color: theme.textSecondary },
                type === item.value && { color: theme.tint, fontWeight: "600" },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { color: theme.text }]}>Title *</Text>
      <TextInput
        style={[styles.input, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground, color: theme.text }]}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g., Annual vaccination, Dental checkup"
        placeholderTextColor={theme.textTertiary}
      />

      <Text style={[styles.label, { color: theme.text }]}>Date & Time</Text>
      <View style={styles.dateTimeRow}>
        <Pressable
          style={[styles.dateButton, styles.dateButtonHalf, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
          <Text style={[styles.dateText, { color: theme.text }]}>
            {scheduledDate.toLocaleDateString()}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.dateButton, styles.dateButtonHalf, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground }]}
          onPress={() => setShowTimePicker(true)}
        >
          <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
          <Text style={[styles.dateText, { color: theme.text }]}>
            {scheduledDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </Pressable>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={scheduledDate}
          mode="date"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (event.type === "set" && date) {
              setScheduledDate(date);
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={scheduledDate}
          mode="time"
          onChange={(event, date) => {
            setShowTimePicker(false);
            if (event.type === "set" && date) {
              setScheduledDate(date);
            }
          }}
        />
      )}

      <Text style={[styles.label, { color: theme.text }]}>Reminder</Text>
      <View style={styles.reminderContainer}>
        {REMINDER_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.reminderButton,
              { borderColor: theme.inputBorder },
              reminderDays === option.value && { borderColor: theme.tint, backgroundColor: theme.tintBackground },
            ]}
            onPress={() => setReminderDays(option.value)}
          >
            <Text
              style={[
                styles.reminderText,
                { color: theme.textSecondary },
                reminderDays === option.value && { color: theme.tint, fontWeight: "500" },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { color: theme.text }]}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground, color: theme.text }]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Add any notes about this visit (optional)"
        placeholderTextColor={theme.textTertiary}
        multiline
        numberOfLines={4}
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
