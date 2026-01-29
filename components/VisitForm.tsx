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
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { VetVisit } from "@/db/schema";

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Visit Type</Text>
      <View style={styles.typeContainer}>
        {VISIT_TYPES.map((item) => (
          <Pressable
            key={item.value}
            style={[
              styles.typeButton,
              type === item.value && styles.typeButtonActive,
            ]}
            onPress={() => setType(item.value)}
          >
            <Ionicons
              name={item.icon as keyof typeof Ionicons.glyphMap}
              size={24}
              color={type === item.value ? "#007AFF" : "#666"}
            />
            <Text
              style={[
                styles.typeText,
                type === item.value && styles.typeTextActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g., Annual vaccination, Dental checkup"
      />

      <Text style={styles.label}>Date & Time</Text>
      <View style={styles.dateTimeRow}>
        <Pressable
          style={[styles.dateButton, styles.dateButtonHalf]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#666" />
          <Text style={styles.dateText}>
            {scheduledDate.toLocaleDateString()}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.dateButton, styles.dateButtonHalf]}
          onPress={() => setShowTimePicker(true)}
        >
          <Ionicons name="time-outline" size={20} color="#666" />
          <Text style={styles.dateText}>
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

      <Text style={styles.label}>Reminder</Text>
      <View style={styles.reminderContainer}>
        {REMINDER_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.reminderButton,
              reminderDays === option.value && styles.reminderButtonActive,
            ]}
            onPress={() => setReminderDays(option.value)}
          >
            <Text
              style={[
                styles.reminderText,
                reminderDays === option.value && styles.reminderTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Add any notes about this visit (optional)"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

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
    borderColor: "#ddd",
    borderRadius: 8,
    gap: 8,
  },
  typeButtonActive: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F8FF",
  },
  typeText: {
    fontSize: 14,
    color: "#666",
  },
  typeTextActive: {
    color: "#007AFF",
    fontWeight: "600",
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
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  dateButtonHalf: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    color: "#333",
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
    borderColor: "#ddd",
    borderRadius: 20,
  },
  reminderButtonActive: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F8FF",
  },
  reminderText: {
    fontSize: 14,
    color: "#666",
  },
  reminderTextActive: {
    color: "#007AFF",
    fontWeight: "500",
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
