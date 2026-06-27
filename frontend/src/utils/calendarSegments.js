import { toIsoDate } from "./date.js";

export function isMultiDayAllDayEvent(event) {
  if (!event?.allDay) {
    return false;
  }
  return event.startAt.slice(0, 10) !== event.endAt.slice(0, 10);
}

function overlapsRange(eventStart, eventEnd, rangeStart, rangeEnd) {
  return eventStart <= rangeEnd && eventEnd >= rangeStart;
}

export function buildMultiDayEventSegments(events, weeks, monthDate) {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const monthStartIso = toIsoDate(monthStart);
  const monthEndIso = toIsoDate(monthEnd);
  const segmentsByWeek = new Map();

  const relevantEvents = events
    .filter((event) => {
    if (!isMultiDayAllDayEvent(event)) {
      return false;
    }
    const eventStart = event.startAt.slice(0, 10);
    const eventEnd = event.endAt.slice(0, 10);
      return overlapsRange(eventStart, eventEnd, monthStartIso, monthEndIso);
    })
    .map((event) => {
      const eventStart = event.startAt.slice(0, 10);
      const eventEnd = event.endAt.slice(0, 10);
      return {
        ...event,
        __visibleStartIso: eventStart < monthStartIso ? monthStartIso : eventStart,
        __visibleEndIso: eventEnd > monthEndIso ? monthEndIso : eventEnd,
      };
    });

  weeks.forEach((week, weekIndex) => {
    const weekStartIso = toIsoDate(week[0]);
    const weekEndIso = toIsoDate(week[6]);
    const placed = [];

    relevantEvents
      .filter((event) => overlapsRange(event.__visibleStartIso, event.__visibleEndIso, weekStartIso, weekEndIso))
      .sort((left, right) => {
        const leftLength = new Date(left.endAt) - new Date(left.startAt);
        const rightLength = new Date(right.endAt) - new Date(right.startAt);
        if (rightLength !== leftLength) {
          return rightLength - leftLength;
        }
        return left.startAt.localeCompare(right.startAt);
      })
      .forEach((event) => {
        const startIso = event.__visibleStartIso;
        const endIso = event.__visibleEndIso;
        const startIndex = Math.max(
          0,
          week.findIndex((day) => toIsoDate(day) >= startIso)
        );
        const endIndex = [...week].reverse().findIndex((day) => toIsoDate(day) <= endIso);
        const normalizedEndIndex = endIndex === -1 ? 6 : 6 - endIndex;

        let rowIndex = 0;
        while (
          placed.some(
            (segment) =>
              segment.rowIndex === rowIndex &&
              !(normalizedEndIndex < segment.startColumn || startIndex > segment.endColumn)
          )
        ) {
          rowIndex += 1;
        }

        const segment = {
          event,
          weekIndex,
          rowIndex,
          startColumn: startIndex,
          endColumn: normalizedEndIndex,
          continuesFromPreviousWeek: event.startAt.slice(0, 10) < weekStartIso && startIso === weekStartIso,
          continuesToNextWeek: event.endAt.slice(0, 10) > weekEndIso && endIso === weekEndIso,
        };
        placed.push(segment);
      });

    segmentsByWeek.set(weekIndex, placed);
  });

  return segmentsByWeek;
}
