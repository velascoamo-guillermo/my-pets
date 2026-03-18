import { useInviteMember } from "@/hooks/usePetShares";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

export function useInviteMemberScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [email, setEmail] = useState("");

  const inviteMutation = useInviteMember();

  const handleSubmit = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    try {
      await inviteMutation.mutateAsync({ petId: id, email: trimmed });
      Alert.alert("Invitation sent", `An invitation has been sent to ${trimmed}.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Could not send the invitation. Please try again.");
    }
  }, [email, id, inviteMutation, router]);

  return {
    email,
    setEmail,
    isLoading: inviteMutation.isPending,
    handleSubmit,
  };
}
