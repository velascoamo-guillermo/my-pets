import { getFileById } from "@/db/repositories/petFiles";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";

export function usePdfViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: file, isLoading } = useQuery({
    queryKey: ["petFile", id],
    queryFn: () => getFileById(id!),
    enabled: !!id,
  });

  return { file, isLoading };
}
