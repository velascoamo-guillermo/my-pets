jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
  Stack: { Screen: () => null },
  Link: ({ children }: { children: React.ReactNode }) => children,
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
import { useRouter, useLocalSearchParams } from "expo-router";
import * as visitsRepo from "@/db/repositories/visits";
import NewVisitScreen from "@/app/pets/[id]/visits/new";
import { renderWithQueryClient, testVisit } from "@/test-utils/integration";

describe("Create Visit — integration", () => {
  const mockBack = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush, back: mockBack });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "pet-123" });
    (visitsRepo.createVisit as jest.Mock).mockResolvedValue(testVisit);
  });

  it("calls createVisit with petId, type, and title", async () => {
    const { getByTestId } = renderWithQueryClient(<NewVisitScreen />);

    fireEvent.press(getByTestId("visit-type-vaccination"));
    fireEvent.changeText(getByTestId("visit-title-input"), "Annual vaccination");
    await act(async () => {
      fireEvent.press(getByTestId("visit-submit"));
    });

    await waitFor(() => {
      expect(visitsRepo.createVisit).toHaveBeenCalledWith(
        expect.objectContaining({
          petId: "pet-123",
          type: "vaccination",
          title: "Annual vaccination",
        }),
      );
    });
  });

  it("navigates back after successful submission", async () => {
    const { getByTestId } = renderWithQueryClient(<NewVisitScreen />);

    fireEvent.press(getByTestId("visit-type-vaccination"));
    fireEvent.changeText(getByTestId("visit-title-input"), "Annual vaccination");
    await act(async () => {
      fireEvent.press(getByTestId("visit-submit"));
    });

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it("does not call createVisit when title is empty", async () => {
    const { getByTestId } = renderWithQueryClient(<NewVisitScreen />);

    await act(async () => {
      fireEvent.press(getByTestId("visit-submit"));
    });

    expect(visitsRepo.createVisit).not.toHaveBeenCalled();
  });
});
