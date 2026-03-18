import { usePetShares, useRemoveMember } from "@/hooks/usePetShares";
import { usePet } from "@/hooks/usePets";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import { Alert } from "react-native";

export function usePetMembersScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: pet } = usePet(id);
  const { data: shares = [], isLoading } = usePetShares(id);
  const removeMemberMutation = useRemoveMember();

  const handleRemoveMember = useCallback(
    (memberId: string, displayName: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        "Remove Member",
        `Remove ${displayName} from ${pet?.name ?? "this pet"}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () =>
              removeMemberMutation.mutate({ petId: id, memberId }),
          },
        ],
      );
    },
    [id, pet?.name, removeMemberMutation],
  );

  const handleInvitePress = useCallback(() => {
    router.push(`/pets/${id}/members/invite`);
  }, [id, router]);

  return {
    pet,
    shares,
    isLoading,
    handleRemoveMember,
    handleInvitePress,
  };
}
