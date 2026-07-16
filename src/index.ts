import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { web } from "./routes/web.tsx";
import { api } from "./routes/api";

const app = new Hono();

// Static files
app.use("/static/*", serveStatic({ root: "./public" }));

// Web routes
app.route("/", web);

// API routes
app.route("/api", api);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

console.log("🏠 Placebook server running on http://localhost:3000");
export default app;