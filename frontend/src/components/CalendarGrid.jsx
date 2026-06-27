import { useRef } from "react";
import { eventOccursOnDate, monthMatrix, sameDate, toIsoDate } from "../utils/date";
import { buildMultiDayEventSegments, isMultiDayAllDayEvent } from "../utils/calendarSegments";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

export default function CalendarGrid({
  baseDate,
  selectedDate,
  events,
  holidayDates,
  onSelectDate,
  onMonthChange,
  onEventSelect,
}) {
  const weeks = monthMatrix(baseDate);
  const multiDaySegments = buildMultiDayEventSegments(events, weeks, baseDate);
  const touchStartRef = useRef({ x: 0, y: 0 });

  return (
    <div
      className="bg-white pt-2"
      onWheel={(event) => {
        if (Math.abs(event.deltaY) < 14 && Math.abs(event.deltaX) < 14) {
          return;
        }
        onMonthChange(event.deltaY > 0 || event.deltaX > 0 ? 1 : -1);
      }}
      onTouchStart={(event) => {
        touchStartRef.current = {
          x: event.changedTouches[0].clientX,
          y: event.changedTouches[0].clientY,
        };
      }}
      onTouchEnd={(event) => {
        const deltaX = event.changedTouches[0].clientX - touchStartRef.current.x;
        const deltaY = event.changedTouches[0].clientY - touchStartRef.current.y;
        if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY)) {
          onMonthChange(deltaX < 0 ? 1 : -1);
        }
      }}
    >
      <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-semibold">
        {weekdays.map((day) => (
          <div
            key={day}
            className={`py-2 ${
              day === "일" ? "text-red-500" : day === "토" ? "text-blue-600" : "text-zinc-500"
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {weeks.map((week, index) => (
          <div key={index} className="relative">
            {multiDaySegments.get(index)?.length ? (
              <div
                className="pointer-events-none absolute inset-x-0 top-6 z-10 grid grid-cols-7 gap-1"
                style={{ gridAutoRows: "22px" }}
              >
                {multiDaySegments.get(index).map((segment) => {
                  const span = segment.endColumn - segment.startColumn + 1;
                  return (
                    <button
                      key={`${segment.event.id}-${index}-${segment.rowIndex}`}
                      type="button"
                      onClick={() => onEventSelect?.(segment.event)}
                      className="pointer-events-auto h-[22px] overflow-hidden px-2 text-left text-[11px] font-semibold leading-[22px] text-zinc-900"
                      style={{
                        gridColumn: `${segment.startColumn + 1} / span ${span}`,
                        gridRow: `${segment.rowIndex + 1}`,
                        backgroundColor: segment.event.colorHex,
                        borderTopLeftRadius: segment.continuesFromPreviousWeek ? 6 : 10,
                        borderBottomLeftRadius: segment.continuesFromPreviousWeek ? 6 : 10,
                        borderTopRightRadius: segment.continuesToNextWeek ? 6 : 10,
                        borderBottomRightRadius: segment.continuesToNextWeek ? 6 : 10,
                      }}
                    >
                      <span className="block truncate">{segment.event.title}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
            <div key={index} className="grid grid-cols-7 gap-1">
            {week.map((date) => {
              const segmentRows = multiDaySegments.get(index)?.length || 0;
              const dailyEvents = events.filter((event) => eventOccursOnDate(event, date) && !isMultiDayAllDayEvent(event));
              const isCurrentMonth = date.getMonth() === baseDate.getMonth();
              const isSelected = sameDate(date, selectedDate);
              const isHoliday = holidayDates.has(toIsoDate(date));
              const weekday = date.getDay();
              const dateTone = isHoliday || weekday === 0 ? "text-red-500" : weekday === 6 ? "text-blue-500" : "text-ink";

              return (
                <button
                  key={toIsoDate(date)}
                  type="button"
                  onClick={() => onSelectDate(date)}
                  className={`relative min-h-[112px] rounded-[14px] px-1 py-1 text-left transition ${
                    isSelected
                      ? "border-[1.2px] border-black bg-white"
                      : "border border-transparent bg-transparent"
                  } ${isCurrentMonth ? "" : "text-zinc-300"}`}
                >
                  <div
                    className={`absolute left-2 top-2 text-left text-sm font-semibold leading-none ${dateTone}`}
                  >
                    {date.getDate()}
                  </div>
                  <div
                    className="flex min-h-[92px] flex-col items-stretch justify-start gap-1"
                    style={{ paddingTop: 24 + segmentRows * 24 }}
                  >
                    {dailyEvents.slice(0, 4).map((event) =>
                      event.allDay ? (
                        <div
                          key={event.id}
                          className="overflow-hidden rounded-[8px] px-1.5 py-1 text-left text-[10px] font-semibold leading-tight text-zinc-900"
                          style={{
                            backgroundColor: event.colorHex,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            wordBreak: "keep-all",
                          }}
                        >
                          {event.title}
                        </div>
                      ) : (
                        <div key={event.id} className="flex items-start gap-1 text-[10px] font-medium leading-tight text-zinc-800">
                          <span
                            className="mt-0.5 inline-block h-5 w-1 shrink-0 rounded-[2px]"
                            style={{
                              backgroundColor:
                                event.sourceType === "GOOGLE" || event.sourceType === "GOOGLE_HOLIDAY"
                                  ? "#9CA3AF"
                                  : event.colorHex,
                            }}
                          />
                          <span
                            className="overflow-hidden"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              wordBreak: "keep-all",
                            }}
                          >
                            {event.startAt.slice(11, 16)} {event.title}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </button>
              );
            })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
