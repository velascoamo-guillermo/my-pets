import { useCallback } from "react";
import { useRouter } from "expo-router";
import { usePets } from "@/hooks/usePets";

export function usePetListScreen() {
  const router = useRouter();
  const { data: pets = [], isLoading, isFetching, refetch } = usePets();

  const handlePetPress = useCallback(
    (id: string) => {
      router.push(`/pets/${id}`);
    },
    [router],
  );

  return {
    pets,
    isLoading,
    isFetching,
    refetch,
    handlePetPress,
  };
}
