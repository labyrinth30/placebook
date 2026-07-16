import type { Bookmark } from "../db/schema";

export const MarkerCards = ({ bookmarks }: { bookmarks: Bookmark[] }) => {
  if (bookmarks.length === 0) {
    return (
      <div class="empty">
        <div style="font-size: 48px;">🗺️</div>
        <p>아직 저장된 장소가 없어요</p>
        <p style="font-size: 12px; color: #999;">텔레그램에 인스타 링크를 보내보세요!</p>
      </div>
    );
  }

  return (
    <>
      {bookmarks.map((b) => (
        <div class="marker-card" data-id={b.id}>
          <div class="place">{b.placeName || "위치 미확인"}</div>
          <div class="caption">
            {Array.isArray(b.caption) ? b.caption.join(" ") : b.caption || ""}
          </div>
          <div class="meta">
            <span class={`badge ${b.geocodeStatus}`}>
              {b.geocodeStatus === "success" ? "📍 위치 확인" : b.geocodeStatus === "pending" ? "⏳ 위치 확인 중" : "❌ 위치 미확인"}
            </span>
            <span style="margin-left: 8px;">{new Date(b.createdAt!).toLocaleDateString("ko-KR")}</span>
          </div>
          <div style="margin-top: 6px;">
            <a href={b.url} target="_blank" rel="noopener noreferrer">🔗 인스타그램에서 보기</a>
          </div>
        </div>
      ))}
    </>
  );
};