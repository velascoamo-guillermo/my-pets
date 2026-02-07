import { pushDeleteToSupabase } from "@/services/sync";
import { eq, and, gte, lt, desc } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db } from "../client";
import { vetVisits, type VetVisit, type NewVetVisit } from "../schema";

export async function getAllVisits(): Promise<VetVisit[]> {
  return db.select().from(vetVisits).orderBy(desc(vetVisits.scheduledDate)).all();
}

export async function getVisitsByPetId(petId: string): Promise<VetVisit[]> {
  return db
    .select()
    .from(vetVisits)
    .where(eq(vetVisits.petId, petId))
    .orderBy(desc(vetVisits.scheduledDate))
    .all();
}

export async function getUpcomingVisits(): Promise<VetVisit[]> {
  const now = new Date();
  return db
    .select()
    .from(vetVisits)
    .where(
      and(
        gte(vetVisits.scheduledDate, now),
        eq(vetVisits.completed, false)
      )
    )
    .orderBy(vetVisits.scheduledDate)
    .all();
}

export async function getVisitsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<VetVisit[]> {
  return db
    .select()
    .from(vetVisits)
    .where(
      and(
        gte(vetVisits.scheduledDate, startDate),
        lt(vetVisits.scheduledDate, endDate)
      )
    )
    .orderBy(vetVisits.scheduledDate)
    .all();
}

export async function getVisitById(id: string): Promise<VetVisit | undefined> {
  const results = await db
    .select()
    .from(vetVisits)
    .where(eq(vetVisits.id, id))
    .limit(1);
  return results[0];
}

export async function createVisit(
  data: Omit<NewVetVisit, "id" | "createdAt" | "updatedAt" | "syncStatus">
): Promise<VetVisit> {
  const now = new Date();
  const newVisit: NewVetVisit = {
    ...data,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    syncStatus: "pending",
  };

  await db.insert(vetVisits).values(newVisit);
  return newVisit as VetVisit;
}

export async function updateVisit(
  id: string,
  data: Partial<Omit<NewVetVisit, "id" | "createdAt">>
): Promise<VetVisit | undefined> {
  const now = new Date();
  await db
    .update(vetVisits)
    .set({
      ...data,
      updatedAt: now,
      syncStatus: "pending",
    })
    .where(eq(vetVisits.id, id));

  return getVisitById(id);
}

export async function markVisitComplete(id: string): Promise<VetVisit | undefined> {
  return updateVisit(id, {
    completed: true,
    completedDate: new Date(),
  });
}

export async function deleteVisit(id: string): Promise<void> {
  const visit = await getVisitById(id);
  if (visit?.syncStatus === "synced") {
    await pushDeleteToSupabase("vet_visits", id);
  }
  await db.delete(vetVisits).where(eq(vetVisits.id, id));
}
