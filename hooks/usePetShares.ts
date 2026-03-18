import { getSharesByPet } from "@/db/repositories/petShares";
import { queryKeys } from "@/lib/queryKeys";
import { inviteMember, removeMember } from "@/services/sharing";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function usePetShares(petId: string) {
  return useQuery({
    queryKey: queryKeys.shares.byPet(petId),
    queryFn: () => getSharesByPet(petId),
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ petId, email }: { petId: string; email: string }) =>
      inviteMember(petId, email),
    onSuccess: (_, { petId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.byPet(petId) });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ petId, memberId }: { petId: string; memberId: string }) =>
      removeMember(petId, memberId),
    onSuccess: (_, { petId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shares.byPet(petId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.pets.all });
    },
  });
}
