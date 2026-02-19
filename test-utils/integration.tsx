import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Pet, VetVisit } from "@/db/schema";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithQueryClient(
  ui: React.ReactElement,
  queryClient?: QueryClient,
) {
  const client = queryClient ?? createTestQueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

export const testPet: Pet = {
  id: "pet-123",
  name: "Test Pet",
  species: "dog",
  birthDate: null,
  imageUri: null,
  vetName: null,
  vetPhone: null,
  vetAddress: null,
  syncStatus: "pending",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

export const testVisit: VetVisit = {
  id: "visit-123",
  petId: "pet-123",
  type: "vaccination",
  title: "Annual vaccination",
  notes: null,
  // Far future date so it's always "upcoming"
  scheduledDate: new Date("2099-01-01"),
  completed: false,
  completedDate: null,
  reminderDays: 1,
  notificationId: null,
  syncStatus: "pending",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};
