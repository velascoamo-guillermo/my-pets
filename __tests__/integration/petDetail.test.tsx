jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
  Stack: { Screen: () => null },
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/db/repositories/pets", () => ({
  getAllPets: jest.fn().mockResolvedValue([]),
  getPetById: jest.fn(),
  createPet: jest.fn(),
  updatePet: jest.fn(),
  deletePet: jest.fn(),
}));

jest.mock("@/db/repositories/visits", () => ({
  getAllVisits: jest.fn().mockResolvedValue([]),
  getVisitsByPetId: jest.fn().mockResolvedValue([]),
  getUpcomingVisits: jest.fn().mockResolvedValue([]),
  getVisitsByDateRange: jest.fn().mockResolvedValue([]),
  getVisitById: jest.fn(),
  createVisit: jest.fn(),
  updateVisit: jest.fn(),
  markVisitComplete: jest.fn(),
  deleteVisit: jest.fn(),
}));

import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as petsRepo from "@/db/repositories/pets";
import * as visitsRepo from "@/db/repositories/visits";
import PetDetailScreen from "@/app/pets/[id]/index";
import { renderWithQueryClient, testPet } from "@/test-utils/integration";

describe("Pet Detail Screen — integration", () => {
  const mockBack = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush, back: mockBack });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "pet-123" });
    (petsRepo.getPetById as jest.Mock).mockResolvedValue(testPet);
    (visitsRepo.getVisitsByPetId as jest.Mock).mockResolvedValue([]);
  });

  it("renders the add-visit button and delete-pet button after loading", async () => {
    const { getByTestId } = renderWithQueryClient(<PetDetailScreen />);

    await waitFor(() => {
      expect(getByTestId("add-visit-button")).toBeTruthy();
      expect(getByTestId("delete-pet-button")).toBeTruthy();
    });
  });

  it("renders the appointments section", async () => {
    const { getByText } = renderWithQueryClient(<PetDetailScreen />);

    await waitFor(() => {
      expect(getByText("Next Appointments")).toBeTruthy();
    });
  });

  it("navigates to new visit screen when add-visit is pressed", async () => {
    const { getByTestId } = renderWithQueryClient(<PetDetailScreen />);

    await waitFor(() => expect(getByTestId("add-visit-button")).toBeTruthy());
    fireEvent.press(getByTestId("add-visit-button"));

    expect(mockPush).toHaveBeenCalledWith("/pets/pet-123/visits/new");
  });
});
