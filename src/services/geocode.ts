export interface GeocodeResult {
  lat: number;
  lng: number;
  placeName: string;
  address: string;
}

/**
 * Extract geographic keywords from caption text and geocode them
 * via OpenStreetMap Nominatim (free, no API key, 1 req/sec limit).
 */
export async function geocodeCaption(caption: string): Promise<GeocodeResult | null> {
  if (!caption) return null;

  const keywords = extractPlaceKeywords(caption);
  if (keywords.length === 0) return null;

  for (const keyword of keywords) {
    const result = await geocodeSearch(keyword);
    if (result) return result;
  }

  return null;
}

/** Extract likely place keywords from a caption */
function extractPlaceKeywords(text: string): string[] {
  const candidates: string[] = [];

  // Look for 📍 pin address — full address line
  const pinAddress = text.match(/📍([^\n]+)/);
  if (pinAddress) {
    candidates.push(pinAddress[1].trim());
  }

  // Look for Korean place patterns: XX동, XX구, XX시, XX역, XX카페, XX맛집
  const koreanPlace = text.match(
    /[\uac00-\ud7af\ud7b0-\ud7ff]{2,}(?:동|구|시|역|카페|맛집|거리|로|길|산|천|대|교|시장|공원|호수|바다|해변|빌딩|타워|아파트)/g
  );
  if (koreanPlace) candidates.push(...koreanPlace);

  // Look for patterns like "in Seoul", "at Hongdae"
  const englishPlace = text.match(
    /(?:at|in|near)\s+([A-Z][a-zA-Z가-힣]+(?:\s+[A-Z][a-zA-Z가-힣]+)?)/g
  );
  if (englishPlace) {
    candidates.push(
      ...englishPlace.map((p) => p.replace(/(?:at|in|near)\s+/, "").trim())
    );
  }

  // Look for hashtags that look like places
  const hashtags = text.match(/#[\uac00-\ud7af\ud7b0-\ud7ffA-Za-z]{2,}/g);
  if (hashtags) {
    const placeTags = hashtags
      .map((t) => t.replace("#", ""))
      .filter((t) => /(?:동|구|시|역|카페|맛집|거리|맛|투어|트립)$/.test(t));
    candidates.push(...placeTags);
  }

  // De-duplicate and limit
  return [...new Set(candidates)].slice(0, 3);
}

/** Single Nominatim geocode request */
export async function geocodeSearch(query: string): Promise<GeocodeResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("accept-language", "ko");

  // Nominatim requires a reasonable User-Agent and 1 req/sec
  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Placebook/1.0 (instagram-place-bookmarker)",
      Accept: "application/json",
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const place = data[0];
  return {
    lat: parseFloat(place.lat),
    lng: parseFloat(place.lon),
    placeName: place.display_name?.split(",")[0] || query,
    address: place.display_name || query,
  };
}