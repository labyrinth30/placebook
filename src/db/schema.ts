import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const bookmarks = sqliteTable("bookmarks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull().unique(),
  caption: text("caption", { mode: "json" }).$type<string[]>().default([]),
  rawHtml: text("raw_html"),
  lat: real("lat"),
  lng: real("lng"),
  placeName: text("place_name"),
  address: text("address"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$default(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$default(() => new Date()),
  geocodeStatus: text("geocode_status", { enum: ["pending", "success", "failed"] })
    .notNull()
    .default("pending"),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;