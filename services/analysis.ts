import type { LabValue } from "@/db/schema";
import { supabase } from "./supabase";

export type AnalysisRequest = {
  fileUrl: string;
  fileId: string;
  petId: string;
  visitId?: string;
  petSpecies?: "dog" | "cat";
  petAge?: string;
  previousAnalyses?: {
    date: string;
    labValues: LabValue[];
  }[];
};

export type AnalysisResponse = {
  success: boolean;
  labValues?: LabValue[];
  summary?: string;
  interpretation?: string;
  error?: string;
};

export async function analyzePdfFile(
  request: AnalysisRequest
): Promise<AnalysisResponse> {
  const { data, error } = await supabase.functions.invoke("analyze-pdf", {
    body: request,
  });

  if (error) {
    throw new Error(`Analysis failed: ${error.message}`);
  }

  return data as AnalysisResponse;
}
