import * as cheerio from "cheerio";

export interface InstagramData {
  caption: string;
  images: string[];
}

/** Fetch Instagram page and extract caption text. */
export async function fetchInstagramCaption(url: string): Promise<InstagramData> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
  });

  if (!res.ok) {
    throw new Error(`Instagram fetch failed: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Try meta tags first (og:title, og:description)
  let caption =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:title"]').attr("content") ||
    "";

  // Try JSON-LD structure
  const jsonld: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const obj = JSON.parse($(el).text());
      if (obj?.caption) jsonld.push(obj.caption);
      if (obj?.description) jsonld.push(obj.description);
    } catch {}
  });

  // Try the sharedData script (Instagram's __NEXT_DATA__ or __sharedData__)
  let sharedCaption = "";
  $("script").each((_, el) => {
    const text = $(el).text();
    if (text.includes("__sharedData__") || text.includes("graphql")) {
      try {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          const data = JSON.parse(text.slice(start, end + 1));
          const entry = data?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media;
          if (entry?.edge_media_to_caption?.edges?.[0]?.node?.text) {
            sharedCaption = entry.edge_media_to_caption.edges[0].node.text;
          }
        }
      } catch {}
    }
  });

  // Also try window.__INITIAL_STATE__
  let initialCaption = "";
  $("script").each((_, el) => {
    const text = $(el).text().trim();
    if (text.startsWith("window.__INITIAL_STATE__")) {
      try {
        const jsonStr = text.replace("window.__INITIAL_STATE__ = ", "").replace(/;$/, "");
        const data = JSON.parse(jsonStr);
        const media = data?.items?.[0] || Object.values(data?.media ?? {})?.[0];
        if (media?.caption?.text) {
          initialCaption = media.caption.text;
        }
      } catch {}
    }
  });

  caption = sharedCaption || initialCaption || jsonld[0] || caption;

  // Extract image URLs
  const images: string[] = [];
  $('meta[property="og:image"]').each((_, el) => {
    const src = $(el).attr("content");
    if (src) images.push(src);
  });

  return {
    caption: caption.trim(),
    images,
  };
}