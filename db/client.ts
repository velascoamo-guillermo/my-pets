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
  `);
}
