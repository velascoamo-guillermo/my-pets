import { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { useAnalysis, useAnalysesByPet } from "@/hooks/useFileAnalyses";
import { parseLabValues } from "@/db/repositories/fileAnalyses";
import type { LabValue } from "@/db/schema";

export type Comparison = {
  previousValue: string;
  previousDate: string;
  change: string;
  trend: "up" | "down" | "stable";
};

export function useAnalysisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: analysis, isLoading } = useAnalysis(id);
  const { data: allAnalyses = [] } = useAnalysesByPet(analysis?.petId);

  const labValues = useMemo((): LabValue[] => {
    if (!analysis?.labValues) return [];
    return parseLabValues(analysis.labValues);
  }, [analysis?.labValues]);

  const comparisons = useMemo(() => {
    if (!analysis || allAnalyses.length < 2) return {};

    const completedAnalyses = allAnalyses
      .filter((a) => a.status === "completed" && a.analyzedAt)
      .sort((a, b) => b.analyzedAt!.getTime() - a.analyzedAt!.getTime());

    const currentIndex = completedAnalyses.findIndex(
      (a) => a.id === analysis.id
    );
    if (currentIndex === -1 || currentIndex === completedAnalyses.length - 1) {
      return {};
    }

    const previousAnalysis = completedAnalyses[currentIndex + 1];
    const previousLabValues = parseLabValues(previousAnalysis.labValues);

    const comparisonsMap: Record<string, Comparison> = {};

    for (const current of labValues) {
      const previous = previousLabValues.find((p) => p.name === current.name);
      if (!previous) continue;

      const currentNum = parseFloat(current.value);
      const previousNum = parseFloat(previous.value);
      if (isNaN(currentNum) || isNaN(previousNum)) continue;

      const diff = currentNum - previousNum;
      const percentChange = ((diff / previousNum) * 100).toFixed(1);

      comparisonsMap[current.name] = {
        previousValue: previous.value,
        previousDate: previousAnalysis.analyzedAt!.toLocaleDateString(),
        change: `${diff > 0 ? "+" : ""}${diff.toFixed(2)} (${percentChange}%)`,
        trend: diff > 0 ? "up" : diff < 0 ? "down" : "stable",
      };
    }

    return comparisonsMap;
  }, [analysis, allAnalyses, labValues]);

  return {
    analysis,
    labValues,
    comparisons,
    isLoading,
  };
}
