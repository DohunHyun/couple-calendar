import { useEffect, useMemo, useState } from "react";
import { formatMonthTitle, toIsoDate } from "../utils/date";
import { getEventVisibility } from "../utils/eventVisibility";

function formatEventDate(event) {
  const start = new Date(event.startAt);
  const dateLabel = `${start.getMonth() + 1}월 ${start.getDate()}일`;
  if (event.allDay) {
    return `${dateLabel} · 종일`;
  }
  return `${dateLabel} · ${event.startAt.slice(11, 16)}`;
}

export default function EventSearchModal({ open, events, onClose, onSelectEvent }) {
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    if (!open) {
      setKeyword("");
    }
  }, [open]);

  const normalizedKeyword = keyword.trim().toLowerCase();

  const sortedEvents = useMemo(() => {
    return [...events].sort((left, right) => new Date(left.startAt) - new Date(right.startAt));
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!normalizedKeyword) {
      return sortedEvents.slice(0, 8);
    }
    return sortedEvents.filter((event) => {
      const searchTarget = [event.title, event.content, event.categoryName].filter(Boolean).join(" ").toLowerCase();
      return searchTarget.includes(normalizedKeyword);
    });
  }, [normalizedKeyword, sortedEvents]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] bg-[rgba(255,255,255,0.98)]">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 pb-8 pt-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 flex-1 items-center rounded-[26px] bg-[#F2F3F5] px-4">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20L17 17" strokeLinecap="round" />
            </svg>
            <input
              autoFocus
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="일정 검색"
              className="ml-3 w-full border-0 bg-transparent text-base text-zinc-900 outline-none placeholder:text-zinc-400"
            />
          </div>
          <button
            type="button"
            aria-label="검색 닫기"
            onClick={onClose}
            className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2F3F5] text-[24px] font-bold leading-none text-[#111111]"
          >
            ×
          </button>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto bg-white">
          {!normalizedKeyword ? (
            <p className="mb-3 text-sm font-semibold text-zinc-500">최근 일정</p>
          ) : null}

          {filteredEvents.length === 0 ? (
            <div className="rounded-3xl border border-[#EFEFF2] bg-white px-5 py-10 text-center text-sm text-zinc-500">
              검색 결과가 없어요.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEvents.map((event) => (
                <button
                  key={`${event.id}-${toIsoDate(new Date(event.startAt))}`}
                  type="button"
                  onClick={() => onSelectEvent(event)}
                  className="flex w-full items-start gap-3 rounded-[22px] border border-[#EFEFF2] bg-white px-4 py-3 text-left shadow-[0_8px_18px_rgba(15,23,42,0.03)]"
                >
                  <span
                    className={`mt-1 inline-block shrink-0 ${event.allDay ? "h-5 w-5 rounded-md" : "h-6 w-1 rounded-full"}`}
                    style={{
                      backgroundColor:
                        event.sourceType === "GOOGLE" || event.sourceType === "GOOGLE_HOLIDAY" ? "#C0C4CC" : event.colorHex,
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-[15px] font-semibold text-zinc-900">{event.title}</strong>
                    <span className="mt-1 block text-sm text-zinc-500">{formatEventDate(event)}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span
                        className={`rounded-full px-2 py-1 font-semibold ${
                          getEventVisibility(event) === "shared"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {getEventVisibility(event) === "shared" ? "Shared" : "Private"}
                      </span>
                      <span>{formatMonthTitle(new Date(event.startAt))}</span>
                      <span>작성자: {event.ownerNickname || event.ownerId}</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
