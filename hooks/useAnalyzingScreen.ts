import { useEffect, useCallback, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAnalysisById } from "@/db/repositories/fileAnalyses";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";

export function useAnalyzingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: analysis } = useQuery({
    queryKey: queryKeys.analyses.detail(id!),
    queryFn: () => getAnalysisById(id!),
    enabled: !!id,
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (!analysis) return;

    if (analysis.status === "completed") {
      router.replace(`/analyses/${analysis.id}`);
    } else if (analysis.status === "failed") {
      setIsError(true);
      setErrorMessage(analysis.errorMessage ?? "An unknown error occurred");
    }
  }, [analysis?.status, analysis?.id, analysis?.errorMessage, router]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return {
    analysis,
    isError,
    errorMessage,
    handleClose,
  };
}
