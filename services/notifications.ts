import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { VetVisit, Pet } from "@/db/schema";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === "granted") {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleVisitNotification(
  visit: VetVisit,
  pet: Pet
): Promise<string | null> {
  if (visit.reminderDays === 0) {
    return null;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return null;
  }

  const reminderDate = new Date(visit.scheduledDate);
  reminderDate.setDate(reminderDate.getDate() - visit.reminderDays);
  reminderDate.setHours(9, 0, 0, 0);

  if (reminderDate <= new Date()) {
    return null;
  }

  const visitTypeLabels = {
    vaccination: "Vaccination",
    checkup: "Checkup",
    emergency: "Emergency visit",
    other: "Vet visit",
  };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${visitTypeLabels[visit.type]} Reminder`,
      body: `${pet.name} has a ${visit.title.toLowerCase()} scheduled ${
        visit.reminderDays === 1
          ? "tomorrow"
          : `in ${visit.reminderDays} days`
      }`,
      data: {
        visitId: visit.id,
        petId: pet.id,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });

  return notificationId;
}

export async function cancelVisitNotification(
  notificationId: string | null
): Promise<void> {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}

export function useNotificationSetup() {
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#007AFF",
    });
  }
}
