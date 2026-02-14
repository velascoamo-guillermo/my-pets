import { pushDeleteToSupabase } from "@/services/sync";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db } from "../client";
import { petFiles, type PetFile, type NewPetFile } from "../schema";

export async function getFilesByPetId(petId: string): Promise<PetFile[]> {
  return db
    .select()
    .from(petFiles)
    .where(eq(petFiles.petId, petId))
    .orderBy(desc(petFiles.createdAt))
    .all();
}

export async function getFilesByVisitId(visitId: string): Promise<PetFile[]> {
  return db
    .select()
    .from(petFiles)
    .where(eq(petFiles.visitId, visitId))
    .orderBy(desc(petFiles.createdAt))
    .all();
}

export async function getFileById(id: string): Promise<PetFile | undefined> {
  const results = await db
    .select()
    .from(petFiles)
    .where(eq(petFiles.id, id))
    .limit(1);
  return results[0];
}

export async function createPetFile(
  data: Omit<NewPetFile, "id" | "createdAt" | "syncStatus">
): Promise<PetFile> {
  const now = new Date();
  const newFile: NewPetFile = {
    ...data,
    id: randomUUID(),
    createdAt: now,
    syncStatus: "pending",
  };

  await db.insert(petFiles).values(newFile);
  return newFile as PetFile;
}

export async function deletePetFile(id: string): Promise<void> {
  const file = await getFileById(id);
  if (file?.syncStatus === "synced") {
    await pushDeleteToSupabase("pet_files", id);
  }
  await db.delete(petFiles).where(eq(petFiles.id, id));
}
