import { eq, desc } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db } from "../client";
import {
  fileAnalyses,
  type FileAnalysis,
  type NewFileAnalysis,
  type LabValue,
} from "../schema";

export async function getAnalysisByFileId(
  fileId: string
): Promise<FileAnalysis | null> {
  const results = await db
    .select()
    .from(fileAnalyses)
    .where(eq(fileAnalyses.fileId, fileId))
    .limit(1);
  return results[0] ?? null;
}

export async function getAnalysesByPetId(
  petId: string
): Promise<FileAnalysis[]> {
  return db
    .select()
    .from(fileAnalyses)
    .where(eq(fileAnalyses.petId, petId))
    .orderBy(desc(fileAnalyses.analyzedAt))
    .all();
}

export async function getAnalysisById(
  id: string
): Promise<FileAnalysis | null> {
  const results = await db
    .select()
    .from(fileAnalyses)
    .where(eq(fileAnalyses.id, id))
    .limit(1);
  return results[0] ?? null;
}

export async function createFileAnalysis(
  data: Omit<NewFileAnalysis, "id" | "createdAt" | "updatedAt" | "syncStatus">
): Promise<FileAnalysis> {
  const now = new Date();
  const newAnalysis: NewFileAnalysis = {
    ...data,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    syncStatus: "pending",
  };

  await db.insert(fileAnalyses).values(newAnalysis);
  return newAnalysis as FileAnalysis;
}

export async function updateFileAnalysis(
  id: string,
  data: Partial<Omit<NewFileAnalysis, "id" | "createdAt">>
): Promise<void> {
  await db
    .update(fileAnalyses)
    .set({
      ...data,
      updatedAt: new Date(),
      syncStatus: "pending",
    })
    .where(eq(fileAnalyses.id, id));
}

export function parseLabValues(labValuesJson: string | null): LabValue[] {
  if (!labValuesJson) return [];
  try {
    return JSON.parse(labValuesJson);
  } catch {
    return [];
  }
}
