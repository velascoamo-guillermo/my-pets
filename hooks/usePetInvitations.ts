import { useAuth } from "@/context/AuthContext";
import {
  getInvitationsByPet,
  getPendingInvitationsForEmail,
} from "@/db/repositories/petInvitations";
import { queryKeys } from "@/lib/queryKeys";
import { acceptInvitation, declineInvitation } from "@/services/sharing";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function usePetInvitations(petId: string) {
  return useQuery({
    queryKey: queryKeys.invitations.byPet(petId),
    queryFn: () => getInvitationsByPet(petId),
  });
}

export function usePendingInvitations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.invitations.pending,
    queryFn: () => getPendingInvitationsForEmail(user!.email!),
    enabled: !!user?.email,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => acceptInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.pending });
      queryClient.invalidateQueries({ queryKey: queryKeys.pets.all });
    },
  });
}

export function useDeclineInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => declineInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.pending });
    },
  });
}
