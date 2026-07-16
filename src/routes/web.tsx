import { Hono } from "hono";
import { db, schema } from "../db";
import { eq, desc } from "drizzle-orm";
import { Layout } from "../views/layout";
import { MapPage } from "../views/map";
import { MarkerCards } from "../views/partials";

export const web = new Hono();

web.get("/", async (c) => {
  const bookmarks = await db
    .select()
    .from(schema.bookmarks)
    .orderBy(desc(schema.bookmarks.createdAt))
    .limit(100);

  return c.html(
    <Layout title="지도">
      <MapPage bookmarks={bookmarks} />
    </Layout>
  );
});

web.get("/markers", async (c) => {
  const bookmarks = await db
    .select()
    .from(schema.bookmarks)
    .orderBy(desc(schema.bookmarks.createdAt))
    .limit(100);

  return c.html(<MarkerCards bookmarks={bookmarks} />);
});

web.get("/markers/:id", async (c) => {
  const id = parseInt(c.req.param("id")!, 10);
  const results = await db
    .select()
    .from(schema.bookmarks)
    .where(eq(schema.bookmarks.id, id))
    .limit(1);

  if (!results[0]) return c.notFound();
  return c.json(results[0]);
});