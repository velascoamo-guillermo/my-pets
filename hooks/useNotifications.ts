import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import {
  requestNotificationPermissions,
  scheduleVisitNotification,
  cancelVisitNotification,
} from "@/services/notifications";
import { getPetById } from "@/db/repositories/pets";
import { updateVisit } from "@/db/repositories/visits";
import type { VetVisit, NewVetVisit } from "@/db/schema";

export function useNotificationSetup() {
  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "Pet Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#007AFF",
      });
    }

    requestNotificationPermissions();
  }, []);
}

export async function scheduleNotificationForVisit(
  visit: VetVisit
): Promise<string | null> {
  const pet = await getPetById(visit.petId);
  if (!pet) return null;

  if (visit.notificationId) {
    await cancelVisitNotification(visit.notificationId);
  }

  const notificationId = await scheduleVisitNotification(visit, pet);

  if (notificationId) {
    await updateVisit(visit.id, { notificationId });
  }

  return notificationId;
}

export async function cancelNotificationForVisit(
  visit: VetVisit
): Promise<void> {
  if (visit.notificationId) {
    await cancelVisitNotification(visit.notificationId);
    await updateVisit(visit.id, { notificationId: null });
  }
}

export async function rescheduleNotificationForVisit(
  visitId: string,
  updates: Partial<Omit<NewVetVisit, "id" | "createdAt">>,
  currentVisit: VetVisit
): Promise<void> {
  if (currentVisit.notificationId) {
    await cancelVisitNotification(currentVisit.notificationId);
  }

  if (updates.completed) {
    return;
  }

  const updatedVisit: VetVisit = {
    ...currentVisit,
    ...updates,
    id: visitId,
  };

  await scheduleNotificationForVisit(updatedVisit);
}
