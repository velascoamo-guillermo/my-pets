import { db } from "@/db/client";
import {
  pets,
  vetVisits,
  petFiles,
  type Pet,
  type VetVisit,
  type PetFile,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { File as FSFile, Paths } from "expo-file-system";
import { queryClient } from "@/lib/queryClient";
import { supabase } from "./supabase";

// --- Sync meta table (key-value store for tracking sync state) ---

export const syncMeta = sqliteTable("sync_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// --- Types ---

export type SyncResult = {
  success: boolean;
  pushed: { pets: number; visits: number; files: number };
  pulled: { pets: number; visits: number; files: number };
  deleted: { pets: number; visits: number; files: number };
  error?: string;
};

// --- Last sync tracking ---

const LAST_SYNC_KEY = "last_sync_at";

async function getLastSyncAt(): Promise<string | null> {
  try {
    const result = db
      .select()
      .from(syncMeta)
      .where(eq(syncMeta.key, LAST_SYNC_KEY))
      .all();
    return result[0]?.value ?? null;
  } catch {
    return null;
  }
}

async function setLastSyncAt(date: Date): Promise<void> {
  const value = date.toISOString();
  const existing = await getLastSyncAt();
  if (existing) {
    await db
      .update(syncMeta)
      .set({ value })
      .where(eq(syncMeta.key, LAST_SYNC_KEY));
  } else {
    await db.insert(syncMeta).values({ key: LAST_SYNC_KEY, value });
  }
}

// --- Query helpers ---

async function getPendingPets(): Promise<Pet[]> {
  return db.select().from(pets).where(eq(pets.syncStatus, "pending")).all();
}

async function getPendingVisits(): Promise<VetVisit[]> {
  return db
    .select()
    .from(vetVisits)
    .where(eq(vetVisits.syncStatus, "pending"))
    .all();
}

async function getPendingFiles(): Promise<PetFile[]> {
  return db
    .select()
    .from(petFiles)
    .where(eq(petFiles.syncStatus, "pending"))
    .all();
}

export async function getSyncStats(): Promise<{
  pendingPets: number;
  pendingVisits: number;
  pendingFiles: number;
  lastSyncAt: string | null;
}> {
  const [pendingP, pendingV, pendingF] = await Promise.all([
    getPendingPets(),
    getPendingVisits(),
    getPendingFiles(),
  ]);

  return {
    pendingPets: pendingP.length,
    pendingVisits: pendingV.length,
    pendingFiles: pendingF.length,
    lastSyncAt: await getLastSyncAt(),
  };
}

// --- Push: Local -> Supabase ---

function petToRemote(pet: Pet) {
  return {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    birth_date: pet.birthDate?.toISOString() ?? null,
    image_uri: pet.imageUri,
    vet_name: pet.vetName,
    vet_phone: pet.vetPhone,
    vet_address: pet.vetAddress,
    created_at: pet.createdAt.toISOString(),
    updated_at: pet.updatedAt.toISOString(),
  };
}

function visitToRemote(visit: VetVisit) {
  return {
    id: visit.id,
    pet_id: visit.petId,
    type: visit.type,
    title: visit.title,
    notes: visit.notes,
    scheduled_date: visit.scheduledDate.toISOString(),
    completed: visit.completed,
    completed_date: visit.completedDate?.toISOString() ?? null,
    reminder_days: visit.reminderDays,
    created_at: visit.createdAt.toISOString(),
    updated_at: visit.updatedAt.toISOString(),
  };
}

function fileToRemote(file: PetFile) {
  return {
    id: file.id,
    pet_id: file.petId,
    name: file.name,
    remote_uri: file.remoteUri,
    file_type: file.fileType,
    file_size: file.fileSize,
    created_at: file.createdAt.toISOString(),
  };
}

async function uploadPetImage(pet: Pet): Promise<string | null> {
  if (!pet.imageUri || !pet.imageUri.startsWith("file://")) return pet.imageUri;

  const localFile = new FSFile(pet.imageUri);
  if (!localFile.exists) return pet.imageUri;

  const fileName = pet.imageUri.split("/").pop()!;
  const storagePath = `${pet.id}/images/${fileName}`;
  const fileBytes = await localFile.bytes();

  const { error } = await supabase.storage
    .from("pet-files")
    .upload(storagePath, fileBytes, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) throw new Error(`Pet image upload failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from("pet-files").getPublicUrl(storagePath);

  return publicUrl;
}

async function pushPets(): Promise<number> {
  const pending = await getPendingPets();
  if (pending.length === 0) return 0;

  for (const pet of pending) {
    const imageUri = await uploadPetImage(pet);

    const { error } = await supabase
      .from("pets")
      .upsert(petToRemote({ ...pet, imageUri }), { onConflict: "id" });

    if (error) throw new Error(`Push pets failed: ${error.message}`);

    await db
      .update(pets)
      .set({ syncStatus: "synced", imageUri })
      .where(eq(pets.id, pet.id));
  }

  return pending.length;
}

async function pushVisits(): Promise<number> {
  const pending = await getPendingVisits();
  if (pending.length === 0) return 0;

  const { error } = await supabase
    .from("vet_visits")
    .upsert(pending.map(visitToRemote), { onConflict: "id" });

  if (error) throw new Error(`Push visits failed: ${error.message}`);

  for (const visit of pending) {
    await db
      .update(vetVisits)
      .set({ syncStatus: "synced" })
      .where(eq(vetVisits.id, visit.id));
  }

  return pending.length;
}

async function uploadFileToStorage(file: PetFile): Promise<string> {
  const localFile = new FSFile(file.uri);
  if (!localFile.exists) {
    throw new Error(`Local file not found: ${file.uri}`);
  }

  const storagePath = `${file.petId}/files/${file.id}-${file.name}`;
  const fileBytes = await localFile.bytes();

  const { error } = await supabase.storage
    .from("pet-files")
    .upload(storagePath, fileBytes, {
      contentType: file.fileType,
      upsert: true,
    });

  if (error) throw new Error(`File upload failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from("pet-files").getPublicUrl(storagePath);

  return publicUrl;
}

async function pushFiles(): Promise<number> {
  const pending = await getPendingFiles();
  if (pending.length === 0) return 0;

  let pushed = 0;
  for (const file of pending) {
    try {
      let remoteUri = file.remoteUri;
      if (!remoteUri) {
        remoteUri = await uploadFileToStorage(file);
      }

      const remoteData = { ...fileToRemote(file), remote_uri: remoteUri };
      const { error } = await supabase
        .from("pet_files")
        .upsert(remoteData, { onConflict: "id" });

      if (error) throw error;

      await db
        .update(petFiles)
        .set({ syncStatus: "synced", remoteUri })
        .where(eq(petFiles.id, file.id));

      pushed++;
    } catch {
      // Skip individual file failures, continue with the rest
    }
  }

  return pushed;
}

// --- Pull: Supabase -> Local ---

async function pullPets(lastSync: string | null): Promise<{
  pulled: number;
  deleted: number;
}> {
  let query = supabase.from("pets").select("*");
  if (lastSync) {
    query = query.gt("updated_at", lastSync);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Pull pets failed: ${error.message}`);
  if (!data) return { pulled: 0, deleted: 0 };

  let pulled = 0;
  let deleted = 0;

  for (const remote of data) {
    if (remote.deleted_at) {
      await db.delete(pets).where(eq(pets.id, remote.id));
      deleted++;
      continue;
    }

    const existing = await db
      .select()
      .from(pets)
      .where(eq(pets.id, remote.id))
      .limit(1);

    const localData = {
      id: remote.id,
      name: remote.name,
      species: remote.species as "dog" | "cat",
      birthDate: remote.birth_date ? new Date(remote.birth_date) : null,
      imageUri: remote.image_uri,
      vetName: remote.vet_name,
      vetPhone: remote.vet_phone,
      vetAddress: remote.vet_address,
      createdAt: new Date(remote.created_at),
      updatedAt: new Date(remote.updated_at),
      syncStatus: "synced" as const,
    };

    if (existing.length === 0) {
      await db.insert(pets).values(localData);
      pulled++;
    } else {
      const local = existing[0];
      if (new Date(remote.updated_at) > local.updatedAt) {
        await db.update(pets).set(localData).where(eq(pets.id, remote.id));
        pulled++;
      }
    }
  }

  return { pulled, deleted };
}

async function pullVisits(lastSync: string | null): Promise<{
  pulled: number;
  deleted: number;
}> {
  let query = supabase.from("vet_visits").select("*");
  if (lastSync) {
    query = query.gt("updated_at", lastSync);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Pull visits failed: ${error.message}`);
  if (!data) return { pulled: 0, deleted: 0 };

  let pulled = 0;
  let deleted = 0;

  for (const remote of data) {
    if (remote.deleted_at) {
      await db.delete(vetVisits).where(eq(vetVisits.id, remote.id));
      deleted++;
      continue;
    }

    const existing = await db
      .select()
      .from(vetVisits)
      .where(eq(vetVisits.id, remote.id))
      .limit(1);

    const localData = {
      id: remote.id,
      petId: remote.pet_id,
      type: remote.type as "vaccination" | "checkup" | "emergency" | "other",
      title: remote.title,
      notes: remote.notes,
      scheduledDate: new Date(remote.scheduled_date),
      completed: remote.completed,
      completedDate: remote.completed_date
        ? new Date(remote.completed_date)
        : null,
      reminderDays: remote.reminder_days,
      createdAt: new Date(remote.created_at),
      updatedAt: new Date(remote.updated_at),
      syncStatus: "synced" as const,
    };

    if (existing.length === 0) {
      await db.insert(vetVisits).values(localData);
      pulled++;
    } else {
      const local = existing[0];
      if (new Date(remote.updated_at) > local.updatedAt) {
        await db
          .update(vetVisits)
          .set(localData)
          .where(eq(vetVisits.id, remote.id));
        pulled++;
      }
    }
  }

  return { pulled, deleted };
}

async function downloadFileFromStorage(
  remoteUri: string,
  petId: string,
  fileName: string
): Promise<string> {
  const dir = `${Paths.document}/pet-files`;
  const localPath = `${dir}/${petId}-${fileName}`;

  const localFile = new FSFile(localPath);
  if (localFile.exists) return localPath;

  const dirFile = new FSFile(dir);
  if (!dirFile.exists) {
    await dirFile.create({ intermediates: true });
  }

  const response = await fetch(remoteUri);
  const buffer = await response.arrayBuffer();
  localFile.write(new Uint8Array(buffer));

  return localPath;
}

async function pullFiles(lastSync: string | null): Promise<{
  pulled: number;
  deleted: number;
}> {
  let query = supabase.from("pet_files").select("*");
  if (lastSync) {
    query = query.gt("created_at", lastSync);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Pull files failed: ${error.message}`);
  if (!data) return { pulled: 0, deleted: 0 };

  let pulled = 0;
  let deleted = 0;

  for (const remote of data) {
    if (remote.deleted_at) {
      const existing = await db
        .select()
        .from(petFiles)
        .where(eq(petFiles.id, remote.id))
        .limit(1);

      if (existing.length > 0) {
        try {
          const localFile = new FSFile(existing[0].uri);
          if (localFile.exists) localFile.delete();
        } catch {
          // File already gone
        }
        await db.delete(petFiles).where(eq(petFiles.id, remote.id));
        deleted++;
      }
      continue;
    }

    const existing = await db
      .select()
      .from(petFiles)
      .where(eq(petFiles.id, remote.id))
      .limit(1);

    if (existing.length === 0 && remote.remote_uri) {
      try {
        const localPath = await downloadFileFromStorage(
          remote.remote_uri,
          remote.pet_id,
          remote.name
        );

        await db.insert(petFiles).values({
          id: remote.id,
          petId: remote.pet_id,
          name: remote.name,
          uri: localPath,
          remoteUri: remote.remote_uri,
          fileType: remote.file_type,
          fileSize: remote.file_size,
          createdAt: new Date(remote.created_at),
          syncStatus: "synced",
        });
        pulled++;
      } catch {
        // Skip files that fail to download
      }
    }
  }

  return { pulled, deleted };
}

// --- Delete sync: push local deletes to Supabase ---

export async function pushDeleteToSupabase(
  table: "pets" | "vet_visits" | "pet_files",
  id: string
): Promise<void> {
  try {
    await supabase
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
  } catch {
    // If push fails, the item is already deleted locally.
    // It will remain on remote until next cleanup.
  }
}

// --- Main sync function ---

export async function syncWithSupabase(): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    pushed: { pets: 0, visits: 0, files: 0 },
    pulled: { pets: 0, visits: 0, files: 0 },
    deleted: { pets: 0, visits: 0, files: 0 },
  };

  try {
    const lastSync = await getLastSyncAt();
    const syncStartedAt = new Date();

    // Push first (pets before visits due to FK constraint)
    result.pushed.pets = await pushPets();
    result.pushed.visits = await pushVisits();
    result.pushed.files = await pushFiles();

    // Then pull (pets before visits due to FK constraint)
    const pulledPets = await pullPets(lastSync);
    result.pulled.pets = pulledPets.pulled;
    result.deleted.pets = pulledPets.deleted;

    const pulledVisits = await pullVisits(lastSync);
    result.pulled.visits = pulledVisits.pulled;
    result.deleted.visits = pulledVisits.deleted;

    const pulledFiles = await pullFiles(lastSync);
    result.pulled.files = pulledFiles.pulled;
    result.deleted.files = pulledFiles.deleted;

    await setLastSyncAt(syncStartedAt);
    result.success = true;
    queryClient.invalidateQueries();
  } catch (err) {
    result.error = err instanceof Error ? err.message : "Unknown sync error";
  }

  return result;
}
