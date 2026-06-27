import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_TEST_EVENTS } from "../dev/testCalendarData.js";
import { monthMatrix } from "./date.js";
import { buildMultiDayEventSegments, isMultiDayAllDayEvent } from "./calendarSegments.js";
import { getVisibleEventsForUser } from "./eventVisibility.js";
import { TEST_USERS } from "../dev/testCalendarData.js";

test("single-day all-day 일정은 멀티데이 아님", () => {
  const event = {
    allDay: true,
    startAt: "2026-07-20T00:00:00",
    endAt: "2026-07-20T00:00:00",
  };
  assert.equal(isMultiDayAllDayEvent(event), false);
});

test("timed event는 멀티데이 아님", () => {
  const event = {
    allDay: false,
    startAt: "2026-07-17T10:00:00",
    endAt: "2026-07-20T10:00:00",
  };
  assert.equal(isMultiDayAllDayEvent(event), false);
});

test("같은 주 안 멀티데이 일정은 하나의 세그먼트", () => {
  const baseDate = new Date(2026, 6, 1);
  const weeks = monthMatrix(baseDate);
  const event = DEFAULT_TEST_EVENTS.find((item) => item.id === "event-private-b-multiday-001");
  const segmentsByWeek = buildMultiDayEventSegments([event], weeks, baseDate);
  const flat = [...segmentsByWeek.values()].flat();
  assert.equal(flat.length, 1);
  assert.equal(flat[0].startColumn, 1);
  assert.equal(flat[0].endColumn, 3);
});

test("주를 넘는 멀티데이 일정은 두 세그먼트", () => {
  const baseDate = new Date(2026, 6, 1);
  const weeks = monthMatrix(baseDate);
  const event = DEFAULT_TEST_EVENTS.find((item) => item.id === "event-shared-multiday-001");
  const segmentsByWeek = buildMultiDayEventSegments([event], weeks, baseDate);
  const flat = [...segmentsByWeek.values()].flat();
  assert.equal(flat.length, 2);
  assert.deepEqual(
    flat.map((segment) => [segment.startColumn, segment.endColumn]),
    [
      [5, 6],
      [0, 1],
    ]
  );
});

test("월 경계 멀티데이 일정은 현재 월 구간만 표시", () => {
  const baseDate = new Date(2026, 6, 1);
  const weeks = monthMatrix(baseDate);
  const event = {
    id: "month-boundary",
    title: "월경계",
    allDay: true,
    startAt: "2026-07-30T00:00:00",
    endAt: "2026-08-02T00:00:00",
  };
  const segmentsByWeek = buildMultiDayEventSegments([event], weeks, baseDate);
  const flat = [...segmentsByWeek.values()].flat();
  assert.equal(flat.length, 1);
  assert.equal(flat[0].startColumn, 4);
  assert.equal(flat[0].endColumn, 5);
});

test("보이는 이벤트만 세그먼트 계산에 들어감", () => {
  const baseDate = new Date(2026, 6, 1);
  const weeks = monthMatrix(baseDate);
  const visibleForA = getVisibleEventsForUser(DEFAULT_TEST_EVENTS, TEST_USERS.A, "all");
  const segments = [...buildMultiDayEventSegments(visibleForA, weeks, baseDate).values()].flat();
  const ids = segments.map((segment) => segment.event.id).sort();
  assert.deepEqual(ids, ["event-private-a-multiday-001", "event-shared-multiday-001", "event-shared-multiday-001"]);
});
