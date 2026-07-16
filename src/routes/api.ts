import { Hono } from "hono";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import { geocodeCaption, geocodeSearch } from "../services/geocode";
import { fetchInstagramCaption } from "../services/instagram";

export const api = new Hono();

api.post("/bookmark", async (c) => {
  const body = await c.req.json<{
    url: string;
    caption?: string;
    placeName?: string;
    lat?: number;
    lng?: number;
  }>();

  if (!body.url || !body.url.includes("instagram.com")) {
    return c.json({ error: "올바른 인스타그램 URL을 입력해주세요." }, 400);
  }

  // Check if already exists
  const existing = await db
    .select()
    .from(schema.bookmarks)
    .where(eq(schema.bookmarks.url, body.url))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ message: "이미 저장된 링크입니다.", bookmark: existing[0] });
  }

  // If caption provided directly, use it. Otherwise try to scrape.
  let caption = body.caption || "";
  let captionLines: string[] = [];

  if (caption) {
    captionLines = caption.split("\n").filter(Boolean);
  } else {
    try {
      const ig = await fetchInstagramCaption(body.url);
      caption = ig.caption;
      captionLines = caption.split("\n").filter(Boolean);
    } catch {
      // scraping failed, that's ok
    }
  }

  // Insert the bookmark
  const inserted = await db
    .insert(schema.bookmarks)
    .values({
      url: body.url,
      caption: captionLines.length > 0 ? captionLines : null,
      geocodeStatus: "pending",
    })
    .returning();

  const bookmark = inserted[0];

  // Geocode: try explicit coords first, then caption
  if (body.lat && body.lng) {
    await db
      .update(schema.bookmarks)
      .set({
        lat: body.lat,
        lng: body.lng,
        placeName: body.placeName || "핀",
        geocodeStatus: "success",
      })
      .where(eq(schema.bookmarks.id, bookmark.id));
  } else if (body.placeName) {
    geocodeSearch(body.placeName).then(async (geo) => {
      if (geo) {
        await db
          .update(schema.bookmarks)
          .set({
            lat: geo.lat,
            lng: geo.lng,
            placeName: geo.placeName,
            address: geo.address,
            geocodeStatus: "success",
          })
          .where(eq(schema.bookmarks.id, bookmark.id));
      } else {
        await db
          .update(schema.bookmarks)
          .set({ geocodeStatus: "failed" })
          .where(eq(schema.bookmarks.id, bookmark.id));
      }
    });
  } else if (caption) {
    geocodeCaption(caption).then(async (geo) => {
      if (geo) {
        await db
          .update(schema.bookmarks)
          .set({
            lat: geo.lat,
            lng: geo.lng,
            placeName: geo.placeName,
            address: geo.address,
            geocodeStatus: "success",
          })
          .where(eq(schema.bookmarks.id, bookmark.id));
      } else {
        await db
          .update(schema.bookmarks)
          .set({ geocodeStatus: "failed" })
          .where(eq(schema.bookmarks.id, bookmark.id));
      }
    });
  } else {
    await db
      .update(schema.bookmarks)
      .set({ geocodeStatus: "failed" })
      .where(eq(schema.bookmarks.id, bookmark.id));
  }

  return c.json({
    message: "저장 완료! 지도에서 확인해보세요.",
    bookmark: { ...bookmark, caption: captionLines },
    caption,
  });
});

api.get("/bookmarks", async (c) => {
  const bookmarks = await db
    .select()
    .from(schema.bookmarks)
    .orderBy(schema.bookmarks.createdAt);

  return c.json(bookmarks);
});