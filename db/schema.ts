import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const pets = sqliteTable("pets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  species: text("species", { enum: ["dog", "cat"] }).notNull(),

  birthDate: integer("birth_date", { mode: "timestamp" }),
  imageUri: text("image_uri"),
  vetName: text("vet_name"),
  vetPhone: text("vet_phone"),
  vetAddress: text("vet_address"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  syncStatus: text("sync_status", {
    enum: ["synced", "pending", "conflict"],
  })
    .notNull()
    .default("pending"),
});

export const vetVisits = sqliteTable("vet_visits", {
  id: text("id").primaryKey(),
  petId: text("pet_id")
    .notNull()
    .references(() => pets.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["vaccination", "checkup", "emergency", "other"],
  }).notNull(),
  title: text("title").notNull(),
  notes: text("notes"),
  scheduledDate: integer("scheduled_date", { mode: "timestamp" }).notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  completedDate: integer("completed_date", { mode: "timestamp" }),
  reminderDays: integer("reminder_days").notNull().default(1),
  notificationId: text("notification_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  syncStatus: text("sync_status", {
    enum: ["synced", "pending", "conflict"],
  })
    .notNull()
    .default("pending"),
});

export const petFiles = sqliteTable("pet_files", {
  id: text("id").primaryKey(),
  petId: text("pet_id")
    .notNull()
    .references(() => pets.id, { onDelete: "cascade" }),
  visitId: text("visit_id").references(() => vetVisits.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  uri: text("uri").notNull(),
  remoteUri: text("remote_uri"),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  syncStatus: text("sync_status", {
    enum: ["synced", "pending", "conflict"],
  })
    .notNull()
    .default("pending"),
});

export type Pet = typeof pets.$inferSelect;
export type NewPet = typeof pets.$inferInsert;
export type VetVisit = typeof vetVisits.$inferSelect;
export type NewVetVisit = typeof vetVisits.$inferInsert;
export type PetFile = typeof petFiles.$inferSelect;
export type NewPetFile = typeof petFiles.$inferInsert;

export const fileAnalyses = sqliteTable("file_analyses", {
  id: text("id").primaryKey(),
  fileId: text("file_id")
    .notNull()
    .references(() => petFiles.id, { onDelete: "cascade" }),
  petId: text("pet_id")
    .notNull()
    .references(() => pets.id, { onDelete: "cascade" }),
  visitId: text("visit_id").references(() => vetVisits.id, {
    onDelete: "cascade",
  }),
  status: text("status", {
    enum: ["pending", "processing", "completed", "failed"],
  })
    .notNull()
    .default("pending"),
  labValues: text("lab_values"),
  summary: text("summary"),
  interpretation: text("interpretation"),
  errorMessage: text("error_message"),
  analyzedAt: integer("analyzed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  syncStatus: text("sync_status", {
    enum: ["synced", "pending", "conflict"],
  })
    .notNull()
    .default("pending"),
});

export type FileAnalysis = typeof fileAnalyses.$inferSelect;
export type NewFileAnalysis = typeof fileAnalyses.$inferInsert;

export type LabValue = {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: "normal" | "high" | "low" | "critical";
  category?: string;
};
