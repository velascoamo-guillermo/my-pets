import { pushDeleteToSupabase } from "@/services/sync";
import { eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db } from "../client";
import { pets, type Pet, type NewPet } from "../schema";

export async function getAllPets(): Promise<Pet[]> {
  return db.select().from(pets).all();
}

export async function getPetById(id: string): Promise<Pet | undefined> {
  const results = await db.select().from(pets).where(eq(pets.id, id)).limit(1);
  return results[0];
}

export async function createPet(
  data: Omit<NewPet, "id" | "createdAt" | "updatedAt" | "syncStatus">
): Promise<Pet> {
  const now = new Date();
  const newPet: NewPet = {
    ...data,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    syncStatus: "pending",
  };

  await db.insert(pets).values(newPet);
  return newPet as Pet;
}

export async function updatePet(
  id: string,
  data: Partial<Omit<NewPet, "id" | "createdAt">>
): Promise<Pet | undefined> {
  const now = new Date();
  await db
    .update(pets)
    .set({
      ...data,
      updatedAt: now,
      syncStatus: "pending",
    })
    .where(eq(pets.id, id));

  return getPetById(id);
}

export async function deletePet(id: string): Promise<void> {
  const pet = await getPetById(id);
  if (pet?.syncStatus === "synced") {
    await pushDeleteToSupabase("pets", id);
  }
  await db.delete(pets).where(eq(pets.id, id));
}
