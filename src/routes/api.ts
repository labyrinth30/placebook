import { Hono } from "hono";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import { fetchInstagramCaption } from "../services/instagram";
import { geocodeCaption } from "../services/geocode";

export const api = new Hono();

api.post("/bookmark", async (c) => {
  const { url } = await c.req.json<{ url: string }>();

  if (!url || !url.includes("instagram.com")) {
    return c.json({ error: "올바른 인스타그램 URL을 입력해주세요." }, 400);
  }

  // Check if already exists
  const existing = await db
    .select()
    .from(schema.bookmarks)
    .where(eq(schema.bookmarks.url, url))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ message: "이미 저장된 링크입니다.", bookmark: existing[0] });
  }

  // Fetch Instagram caption
  const { caption, images } = await fetchInstagramCaption(url);
  const captionLines = caption.split("\n").filter(Boolean);

  // Insert the bookmark
  const inserted = await db
    .insert(schema.bookmarks)
    .values({
      url,
      caption: captionLines,
      rawHtml: null,
      geocodeStatus: "pending",
    })
    .returning();

  const bookmark = inserted[0];

  // Try to geocode (fire and forget)
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
  }).catch(async () => {
    await db
      .update(schema.bookmarks)
      .set({ geocodeStatus: "failed" })
      .where(eq(schema.bookmarks.id, bookmark.id));
  });

  return c.json({
    message: "저장 완료! 지도에서 확인해보세요.",
    bookmark: { ...bookmark, caption: captionLines },
    caption,
    images,
  });
});

api.get("/bookmarks", async (c) => {
  const bookmarks = await db
    .select()
    .from(schema.bookmarks)
    .orderBy(schema.bookmarks.createdAt);

  return c.json(bookmarks);
});