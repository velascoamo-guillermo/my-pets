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
import { Alert } from "react-native";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as petsRepo from "@/db/repositories/pets";
import * as visitsRepo from "@/db/repositories/visits";
import PetDetailScreen from "@/app/pets/[id]/index";
import { renderWithQueryClient, testPet } from "@/test-utils/integration";

describe("Delete Pet — integration", () => {
  const mockBack = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush, back: mockBack });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "pet-123" });
    (petsRepo.getPetById as jest.Mock).mockResolvedValue(testPet);
    (petsRepo.deletePet as jest.Mock).mockResolvedValue(undefined);
    (visitsRepo.getVisitsByPetId as jest.Mock).mockResolvedValue([]);
  });

  it("calls deletePet with the pet id when the user confirms deletion", async () => {
    // Intercept Alert and immediately press the destructive button
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        const deleteBtn = buttons?.find((b) => b.style === "destructive");
        deleteBtn?.onPress?.();
      });

    const { getByTestId } = renderWithQueryClient(<PetDetailScreen />);

    await waitFor(() => expect(getByTestId("delete-pet-button")).toBeTruthy());
    fireEvent.press(getByTestId("delete-pet-button"));

    await waitFor(() => {
      expect(petsRepo.deletePet).toHaveBeenCalledWith("pet-123");
    });

    alertSpy.mockRestore();
  });

  it("navigates back after deletion", async () => {
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        const deleteBtn = buttons?.find((b) => b.style === "destructive");
        deleteBtn?.onPress?.();
      });

    const { getByTestId } = renderWithQueryClient(<PetDetailScreen />);

    await waitFor(() => expect(getByTestId("delete-pet-button")).toBeTruthy());
    fireEvent.press(getByTestId("delete-pet-button"));

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });

    alertSpy.mockRestore();
  });

  it("does not call deletePet when the user cancels", async () => {
    // Intercept Alert and press the Cancel button
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        const cancelBtn = buttons?.find((b) => b.style === "cancel");
        cancelBtn?.onPress?.();
      });

    const { getByTestId } = renderWithQueryClient(<PetDetailScreen />);

    await waitFor(() => expect(getByTestId("delete-pet-button")).toBeTruthy());
    fireEvent.press(getByTestId("delete-pet-button"));

    await new Promise((r) => setTimeout(r, 100));
    expect(petsRepo.deletePet).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
