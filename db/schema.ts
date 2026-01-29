import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const pets = sqliteTable("pets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  species: text("species", { enum: ["dog", "cat"] }).notNull(),
  breed: text("breed"),
  birthDate: integer("birth_date", { mode: "timestamp" }),
  imageUri: text("image_uri"),
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

export type Pet = typeof pets.$inferSelect;
export type NewPet = typeof pets.$inferInsert;
export type VetVisit = typeof vetVisits.$inferSelect;
export type NewVetVisit = typeof vetVisits.$inferInsert;
