import type { Bookmark } from "../db/schema";

export const MapPage = ({ bookmarks }: { bookmarks: Bookmark[] }) => {
  const markers = bookmarks
    .filter((b) => b.lat && b.lng)
    .map((b) => ({
      id: b.id,
      lat: b.lat!,
      lng: b.lng!,
      placeName: b.placeName || "위치 미확인",
      url: b.url,
      caption: Array.isArray(b.caption) ? b.caption.join(" ") : b.caption || "",
      createdAt: b.createdAt,
    }));

  const markersJson = JSON.stringify(markers);

  return (
    <div>
      <div id="map" />
      <div class="marker-list" id="marker-list" hx-get="/markers" hx-trigger="load" hx-swap="innerHTML">
        <div class="empty">로딩 중...</div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
        var map = L.map('map').setView([37.5665, 126.978], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map);

        var markers = ${markersJson};
        var bounds = [];
        markers.forEach(function(m) {
          var marker = L.marker([m.lat, m.lng]).addTo(map);
          var caption = (m.caption || '').substring(0, 100);
          marker.bindPopup(
            '<b>' + m.placeName + '</b><br>' +
            '<small>' + caption + '</small><br>' +
            '<a href="' + m.url + '" target="_blank">인스타 보기 →</a>'
          );
          bounds.push([m.lat, m.lng]);
        });
        if (bounds.length > 0) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      `,
        }}
      />
    </div>
  );
};