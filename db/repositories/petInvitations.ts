import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { petInvitations, type NewPetInvitation, type PetInvitation } from "../schema";

export async function getInvitationsByPet(petId: string): Promise<PetInvitation[]> {
  return db.select().from(petInvitations).where(eq(petInvitations.petId, petId));
}

export async function getPendingInvitationsForEmail(email: string): Promise<PetInvitation[]> {
  return db
    .select()
    .from(petInvitations)
    .where(
      and(
        eq(petInvitations.inviteeEmail, email),
        eq(petInvitations.status, "pending"),
      ),
    );
}

export async function upsertInvitation(invitation: NewPetInvitation): Promise<void> {
  await db
    .insert(petInvitations)
    .values(invitation)
    .onConflictDoUpdate({
      target: petInvitations.id,
      set: { status: invitation.status },
    });
}

export async function updateInvitationStatus(
  id: string,
  status: PetInvitation["status"],
): Promise<void> {
  await db
    .update(petInvitations)
    .set({ status })
    .where(eq(petInvitations.id, id));
}
