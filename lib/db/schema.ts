import {
  date,
  decimal,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const skiRecords = mysqlTable("ski_records", {
  id: varchar("id", { length: 36 }).primaryKey(),
  resort: varchar("resort", { length: 100 }).notNull(),
  date: date("date", { mode: "string" }).notNull(),
  duration: varchar("duration", { length: 20 }).notNull(),
  distanceKm: decimal("distance_km", { precision: 6, scale: 2 }).notNull(),
  maxSpeedKmh: decimal("max_speed_kmh", { precision: 6, scale: 2 }).notNull(),
  verticalM: int("vertical_m").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
