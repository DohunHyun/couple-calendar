import test from "node:test";
import assert from "node:assert/strict";
import { TEST_USERS, DEFAULT_TEST_EVENTS } from "../dev/testCalendarData.js";
import { getVisibleEventsForUser } from "./eventVisibility.js";

function idsFor(events) {
  return events.map((event) => event.id).sort();
}

test("A 계정 all 필터", () => {
  const visible = getVisibleEventsForUser(DEFAULT_TEST_EVENTS, TEST_USERS.A, "all");
  assert.deepEqual(idsFor(visible), [
    "event-private-a-001",
    "event-private-a-002",
    "event-private-a-multiday-001",
    "event-shared-001",
    "event-shared-002",
    "event-shared-multiday-001",
  ]);
});

test("B 계정 all 필터", () => {
  const visible = getVisibleEventsForUser(DEFAULT_TEST_EVENTS, TEST_USERS.B, "all");
  assert.deepEqual(idsFor(visible), [
    "event-private-b-001",
    "event-private-b-002",
    "event-private-b-multiday-001",
    "event-shared-001",
    "event-shared-002",
    "event-shared-multiday-001",
  ]);
});

test("A 계정 shared 필터", () => {
  const visible = getVisibleEventsForUser(DEFAULT_TEST_EVENTS, TEST_USERS.A, "shared");
  assert.deepEqual(idsFor(visible), ["event-shared-001", "event-shared-002", "event-shared-multiday-001"]);
});

test("A 계정 private 필터", () => {
  const visible = getVisibleEventsForUser(DEFAULT_TEST_EVENTS, TEST_USERS.A, "private");
  assert.deepEqual(idsFor(visible), ["event-private-a-001", "event-private-a-002", "event-private-a-multiday-001"]);
});

test("B 계정 private 필터", () => {
  const visible = getVisibleEventsForUser(DEFAULT_TEST_EVENTS, TEST_USERS.B, "private");
  assert.deepEqual(idsFor(visible), ["event-private-b-001", "event-private-b-002", "event-private-b-multiday-001"]);
});

test("currentUser가 null이면 빈 배열 반환", () => {
  const visible = getVisibleEventsForUser(DEFAULT_TEST_EVENTS, null, "all");
  assert.deepEqual(visible, []);
});
