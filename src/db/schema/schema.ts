import { relations, sql } from "drizzle-orm";
import { blob, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Define the Project table schema
export const tbl_projects = sqliteTable("tbl_projects", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  secretKey: text("secret_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`,
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`,
  ),
});

// Define the Cron Job table schema
export const tbl_cron_jobs = sqliteTable("tbl_cron_jobs", {
  id: integer("id").primaryKey(),
  project_id: integer("project_id")
    .notNull()
    .references(() => tbl_projects.id),

  cron_expression: text("cron_expression").notNull(),
  payload: blob("payload", { mode: "json" }), // JSON payload or specific details for the cron job

  isActive: integer("is_active", { mode: "boolean" }).default(true), // Active or paused

  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`,
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`,
  ),
});

// ** __________ RELATIONS __________ **
export const relation_cron_jobs = relations(tbl_cron_jobs, ({ one }) => ({
  projects: one(tbl_projects, {
    fields: [tbl_cron_jobs.project_id],
    references: [tbl_projects.id],
  }),
}));

export const relation_projects = relations(tbl_projects, ({ many }) => ({
  cron_jobs: many(tbl_cron_jobs),
}));
