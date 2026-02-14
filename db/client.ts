import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const DATABASE_NAME = "my-pets.db";

const expoDb = openDatabaseSync(DATABASE_NAME);

export const db = drizzle(expoDb, { schema });

export async function initDatabase() {
  expoDb.execSync(`
    CREATE TABLE IF NOT EXISTS pets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      species TEXT NOT NULL CHECK (species IN ('dog', 'cat')),
      breed TEXT,
      birth_date INTEGER,
      image_uri TEXT,
      vet_name TEXT,
      vet_phone TEXT,
      vet_address TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'conflict'))
    );

    CREATE TABLE IF NOT EXISTS vet_visits (
      id TEXT PRIMARY KEY,
      pet_id TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('vaccination', 'checkup', 'emergency', 'other')),
      title TEXT NOT NULL,
      notes TEXT,
      scheduled_date INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_date INTEGER,
      reminder_days INTEGER NOT NULL DEFAULT 1,
      notification_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'conflict'))
    );

    CREATE INDEX IF NOT EXISTS idx_vet_visits_pet_id ON vet_visits(pet_id);
    CREATE INDEX IF NOT EXISTS idx_vet_visits_scheduled_date ON vet_visits(scheduled_date);

    CREATE TABLE IF NOT EXISTS pet_files (
      id TEXT PRIMARY KEY,
      pet_id TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      uri TEXT NOT NULL,
      remote_uri TEXT,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'conflict'))
    );

    CREATE INDEX IF NOT EXISTS idx_pet_files_pet_id ON pet_files(pet_id);
  `);

  // Migration: add visit_id column to pet_files
  const columns = expoDb.getAllSync<{ name: string }>(
    "PRAGMA table_info(pet_files)"
  );
  if (!columns.some((c) => c.name === "visit_id")) {
    expoDb.execSync(
      "ALTER TABLE pet_files ADD COLUMN visit_id TEXT REFERENCES vet_visits(id) ON DELETE CASCADE"
    );
  }

  // Sync meta table for tracking last sync timestamp
  expoDb.execSync(`
    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}
