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

export async function createPetFile(
  data: Omit<NewPetFile, "id" | "createdAt">
): Promise<PetFile> {
  const now = new Date();
  const newFile: NewPetFile = {
    ...data,
    id: randomUUID(),
    createdAt: now,
  };

  await db.insert(petFiles).values(newFile);
  return newFile as PetFile;
}

export async function deletePetFile(id: string): Promise<void> {
  await db.delete(petFiles).where(eq(petFiles.id, id));
}
