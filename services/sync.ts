import { db } from "@/db/client";
import { pets, vetVisits, type Pet, type VetVisit } from "@/db/schema";
import { eq } from "drizzle-orm";

export type SyncStatus = "synced" | "pending" | "conflict";

export type SyncableEntity = {
  id: string;
  syncStatus: SyncStatus;
  updatedAt: Date;
};

export type SyncResult = {
  success: boolean;
  syncedPets: number;
  syncedVisits: number;
  conflicts: number;
  error?: string;
};

export async function getPendingPets(): Promise<Pet[]> {
  return db
    .select()
    .from(pets)
    .where(eq(pets.syncStatus, "pending"))
    .all();
}

export async function getPendingVisits(): Promise<VetVisit[]> {
  return db
    .select()
    .from(vetVisits)
    .where(eq(vetVisits.syncStatus, "pending"))
    .all();
}

export async function markPetSynced(id: string): Promise<void> {
  await db
    .update(pets)
    .set({ syncStatus: "synced" })
    .where(eq(pets.id, id));
}

export async function markVisitSynced(id: string): Promise<void> {
  await db
    .update(vetVisits)
    .set({ syncStatus: "synced" })
    .where(eq(vetVisits.id, id));
}

export async function markPetConflict(id: string): Promise<void> {
  await db
    .update(pets)
    .set({ syncStatus: "conflict" })
    .where(eq(pets.id, id));
}

export async function markVisitConflict(id: string): Promise<void> {
  await db
    .update(vetVisits)
    .set({ syncStatus: "conflict" })
    .where(eq(vetVisits.id, id));
}

export async function getSyncStats(): Promise<{
  pendingPets: number;
  pendingVisits: number;
  conflictPets: number;
  conflictVisits: number;
}> {
  const pendingPets = await db
    .select()
    .from(pets)
    .where(eq(pets.syncStatus, "pending"))
    .all();

  const pendingVisits = await db
    .select()
    .from(vetVisits)
    .where(eq(vetVisits.syncStatus, "pending"))
    .all();

  const conflictPets = await db
    .select()
    .from(pets)
    .where(eq(pets.syncStatus, "conflict"))
    .all();

  const conflictVisits = await db
    .select()
    .from(vetVisits)
    .where(eq(vetVisits.syncStatus, "conflict"))
    .all();

  return {
    pendingPets: pendingPets.length,
    pendingVisits: pendingVisits.length,
    conflictPets: conflictPets.length,
    conflictVisits: conflictVisits.length,
  };
}

export async function syncWithServer(apiBaseUrl: string): Promise<SyncResult> {
  const pendingPets = await getPendingPets();
  const pendingVisits = await getPendingVisits();

  let syncedPets = 0;
  let syncedVisits = 0;
  let conflicts = 0;

  for (const pet of pendingPets) {
    try {
      const response = await fetch(`${apiBaseUrl}/pets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pet),
      });

      if (response.ok) {
        await markPetSynced(pet.id);
        syncedPets++;
      } else if (response.status === 409) {
        await markPetConflict(pet.id);
        conflicts++;
      }
    } catch {
      return {
        success: false,
        syncedPets,
        syncedVisits,
        conflicts,
        error: "Network error while syncing pets",
      };
    }
  }

  for (const visit of pendingVisits) {
    try {
      const response = await fetch(`${apiBaseUrl}/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visit),
      });

      if (response.ok) {
        await markVisitSynced(visit.id);
        syncedVisits++;
      } else if (response.status === 409) {
        await markVisitConflict(visit.id);
        conflicts++;
      }
    } catch {
      return {
        success: false,
        syncedPets,
        syncedVisits,
        conflicts,
        error: "Network error while syncing visits",
      };
    }
  }

  return {
    success: true,
    syncedPets,
    syncedVisits,
    conflicts,
  };
}

export async function pullFromServer(apiBaseUrl: string): Promise<{
  newPets: number;
  newVisits: number;
  error?: string;
}> {
  let newPets = 0;
  let newVisits = 0;

  try {
    const petsResponse = await fetch(`${apiBaseUrl}/pets`);
    if (petsResponse.ok) {
      const serverPets: Pet[] = await petsResponse.json();
      for (const serverPet of serverPets) {
        const existing = await db
          .select()
          .from(pets)
          .where(eq(pets.id, serverPet.id))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(pets).values({ ...serverPet, syncStatus: "synced" });
          newPets++;
        }
      }
    }

    const visitsResponse = await fetch(`${apiBaseUrl}/visits`);
    if (visitsResponse.ok) {
      const serverVisits: VetVisit[] = await visitsResponse.json();
      for (const serverVisit of serverVisits) {
        const existing = await db
          .select()
          .from(vetVisits)
          .where(eq(vetVisits.id, serverVisit.id))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(vetVisits).values({ ...serverVisit, syncStatus: "synced" });
          newVisits++;
        }
      }
    }
  } catch {
    return { newPets, newVisits, error: "Network error while pulling from server" };
  }

  return { newPets, newVisits };
}
