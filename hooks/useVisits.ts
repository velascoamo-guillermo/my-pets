import {
  getAllVisits,
  getVisitsByPetId,
  getUpcomingVisits,
  getVisitsByDateRange,
  getVisitById,
  createVisit,
  updateVisit,
  markVisitComplete,
  deleteVisit,
} from "@/db/repositories/visits";
import { queryKeys } from "@/lib/queryKeys";
import type { NewVetVisit } from "@/db/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useVisits() {
  return useQuery({
    queryKey: queryKeys.visits.all,
    queryFn: getAllVisits,
  });
}

export function useVisitsByPet(petId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.visits.byPet(petId!),
    queryFn: () => getVisitsByPetId(petId!),
    enabled: !!petId,
  });
}

export function useUpcomingVisits() {
  return useQuery({
    queryKey: queryKeys.visits.upcoming,
    queryFn: getUpcomingVisits,
  });
}

export function useVisitsByDateRange(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: queryKeys.visits.byDateRange(
      startDate.getTime(),
      endDate.getTime(),
    ),
    queryFn: () => getVisitsByDateRange(startDate, endDate),
  });
}

export function useVisit(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.visits.detail(id!),
    queryFn: () => getVisitById(id!),
    enabled: !!id,
  });
}

export function useCreateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Omit<NewVetVisit, "id" | "createdAt" | "updatedAt" | "syncStatus">,
    ) => createVisit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });
}

export function useUpdateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<NewVetVisit, "id" | "createdAt">>;
    }) => updateVisit(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.visits.detail(variables.id),
      });
    },
  });
}

export function useMarkVisitComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markVisitComplete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });
}

export function useDeleteVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVisit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });
}
