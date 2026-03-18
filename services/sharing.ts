import { randomUUID } from "expo-crypto";
import { syncWithSupabase } from "./sync";
import { ensureSession, supabase } from "./supabase";

const INVITATION_TTL_DAYS = 7;

export async function inviteMember(petId: string, email: string): Promise<void> {
  const userId = await ensureSession();
  const expiresAt = new Date(
    Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase.from("pet_invitations").insert({
    id: randomUUID(),
    pet_id: petId,
    owner_id: userId,
    invitee_email: email.toLowerCase().trim(),
    expires_at: expiresAt,
  });

  if (error) throw new Error(`Invite failed: ${error.message}`);
  await syncWithSupabase();
}

export async function acceptInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase.rpc("accept_pet_invitation", {
    p_invitation_id: invitationId,
  });

  if (error) throw new Error(`Accept invitation failed: ${error.message}`);
  await syncWithSupabase();
}

export async function declineInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from("pet_invitations")
    .update({ status: "declined" })
    .eq("id", invitationId);

  if (error) throw new Error(`Decline invitation failed: ${error.message}`);
  await syncWithSupabase();
}

export async function removeMember(petId: string, memberId: string): Promise<void> {
  const { error } = await supabase
    .from("pet_shares")
    .delete()
    .eq("pet_id", petId)
    .eq("member_id", memberId);

  if (error) throw new Error(`Remove member failed: ${error.message}`);
  await syncWithSupabase();
}
