import type { FC, Child } from "hono/jsx";

export const Layout: FC<{ title: string; children: Child }> = ({ title, children }) => {
  return (
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title} - Placebook</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/htmx.org@2.0.4"></script>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #222; }
          header { background: #1a1a2e; color: #fff; padding: 12px 24px; display: flex; align-items: center; gap: 12px; }
          header h1 { font-size: 18px; font-weight: 600; }
          header a { color: #aaa; text-decoration: none; font-size: 14px; margin-left: auto; }
          header a:hover { color: #fff; }
          .container { max-width: 1200px; margin: 0 auto; padding: 16px; }
          #map { height: 65vh; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .marker-list { margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
          .marker-card { background: #fff; border-radius: 10px; padding: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); transition: box-shadow 0.2s; }
          .marker-card:hover { box-shadow: 0 3px 12px rgba(0,0,0,0.15); }
          .marker-card .place { font-weight: 600; font-size: 15px; color: #1a1a2e; }
          .marker-card .caption { font-size: 13px; color: #555; margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
          .marker-card .meta { font-size: 11px; color: #999; margin-top: 6px; }
          .marker-card a { text-decoration: none; color: #3897f0; font-size: 13px; }
          .marker-card a:hover { text-decoration: underline; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; background: #eee; color: #555; }
          .badge.success { background: #d4edda; color: #155724; }
          .badge.pending { background: #fff3cd; color: #856404; }
          .badge.failed { background: #f8d7da; color: #721c24; }
          .empty { text-align: center; padding: 48px; color: #999; }
          .empty p { font-size: 14px; margin-top: 8px; }
          @media (prefers-color-scheme: dark) {
            body { background: #121212; color: #eee; }
            header { background: #0a0a1a; }
            .marker-card { background: #1e1e2e; }
            .marker-card .caption { color: #aaa; }
            .marker-card .meta { color: #777; }
            .badge { background: #333; color: #ccc; }
          }
        `}</style>
      </head>
      <body>
        <header>
          <h1>📍 Placebook</h1>
          <a href="/">지도</a>
        </header>
        <div class="container">
          {children}
        </div>
      </body>
    </html>
  );
};