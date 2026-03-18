import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { petShares, type NewPetShare, type PetShare } from "../schema";

export async function getSharesByPet(petId: string): Promise<PetShare[]> {
  return db.select().from(petShares).where(eq(petShares.petId, petId));
}

export async function upsertShare(share: NewPetShare): Promise<void> {
  await db
    .insert(petShares)
    .values(share)
    .onConflictDoUpdate({
      target: [petShares.petId, petShares.memberId],
      set: {
        memberEmail: share.memberEmail,
        memberDisplayName: share.memberDisplayName,
      },
    });
}

export async function deleteShare(petId: string, memberId: string): Promise<void> {
  await db
    .delete(petShares)
    .where(and(eq(petShares.petId, petId), eq(petShares.memberId, memberId)));
}

export async function deleteAllSharesForPet(petId: string): Promise<void> {
  await db.delete(petShares).where(eq(petShares.petId, petId));
}
