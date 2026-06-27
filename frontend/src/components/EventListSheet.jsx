import BottomSheet from "./BottomSheet";
import { getEventVisibility } from "../utils/eventVisibility";

export default function EventListSheet({ open, dateLabel, events, onClose, onCreate, onEdit }) {
  return (
    <BottomSheet open={open} title={dateLabel} onClose={onClose}>
      <div className="max-h-[45vh] space-y-3 overflow-y-auto pb-4">
        {events.length === 0 ? (
          <div className="rounded-2xl bg-mist px-4 py-6 text-center text-sm text-zinc-500">
            아직 일정이 없습니다.
          </div>
        ) : (
          events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onEdit(event)}
              className="flex w-full items-start gap-3 rounded-2xl border border-zinc-100 px-4 py-3 text-left"
            >
              <span
                className={`mt-1 inline-block ${event.allDay ? "h-5 w-5 rounded-md" : "h-6 w-1 rounded-full"}`}
                style={{
                  backgroundColor: event.sourceType === "GOOGLE" ? "#C0C0C0" : event.colorHex,
                }}
              />
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm text-ink">{event.title}</strong>
                <span className="block truncate text-xs text-zinc-500">
                  {event.allDay ? "종일" : event.startAt.slice(11, 16)} · {event.categoryName}
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                  <span
                    className={`rounded-full px-2 py-1 font-semibold ${
                      getEventVisibility(event) === "shared"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {getEventVisibility(event) === "shared" ? "Shared" : "Private"}
                  </span>
                  <span>작성자: {event.ownerNickname || event.ownerId}</span>
                </span>
              </span>
            </button>
          ))
        )}
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="w-full rounded-2xl bg-black px-4 py-4 text-base font-semibold text-white"
      >
        + 새 일정 등록
      </button>
    </BottomSheet>
  );
}
