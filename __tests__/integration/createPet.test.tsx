// Mocks must be declared before imports (babel-jest hoists them)
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({})),
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
import { act, fireEvent, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import * as petsRepo from "@/db/repositories/pets";
import NewPetScreen from "@/app/pets/new";
import { renderWithQueryClient, testPet } from "@/test-utils/integration";

describe("Create Pet — integration", () => {
  const mockBack = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush, back: mockBack });
    (petsRepo.createPet as jest.Mock).mockResolvedValue(testPet);
  });

  it("calls createPet with the entered name and selected species", async () => {
    const { getByTestId } = renderWithQueryClient(<NewPetScreen />);

    fireEvent.changeText(getByTestId("pet-name-input"), "Test Pet");
    // species-dog is the default but we press it explicitly to match Maestro flow
    fireEvent.press(getByTestId("species-dog"));
    await act(async () => {
      fireEvent.press(getByTestId("pet-submit"));
    });

    await waitFor(() => {
      expect(petsRepo.createPet).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Test Pet", species: "dog" }),
      );
    });
  });

  it("navigates back after successful submission", async () => {
    const { getByTestId } = renderWithQueryClient(<NewPetScreen />);

    fireEvent.changeText(getByTestId("pet-name-input"), "Test Pet");
    await act(async () => {
      fireEvent.press(getByTestId("pet-submit"));
    });

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it("does not call createPet when name is empty", async () => {
    const { getByTestId } = renderWithQueryClient(<NewPetScreen />);

    await act(async () => {
      fireEvent.press(getByTestId("pet-submit"));
    });

    expect(petsRepo.createPet).not.toHaveBeenCalled();
  });
});
