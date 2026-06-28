import { Capacitor } from "@capacitor/core";
import { CapacitorCalendar, CalendarPermissionScope } from "@ebarooni/capacitor-calendar";
import { syncDeviceCalendar as uploadDeviceCalendar } from "../api/events";

const SELECTED_KEY = "deviceSyncSelectedCalendars";

export function isDeviceCalendarAvailable() {
  return Capacitor.isNativePlatform();
}

/** 읽기 권한 확보. granted면 true. */
export async function ensureCalendarPermission() {
  if (!isDeviceCalendarAvailable()) {
    return false;
  }
  const { result: current } = await CapacitorCalendar.checkPermission({
    scope: CalendarPermissionScope.READ_CALENDAR,
  });
  if (current === "granted") {
    return true;
  }
  // iOS는 read-only 단독 요청이 없어 full(read+write) 요청, Android는 read-only.
  const request =
    Capacitor.getPlatform() === "android"
      ? CapacitorCalendar.requestReadOnlyCalendarAccess()
      : CapacitorCalendar.requestFullCalendarAccess();
  const { result } = await request;
  return result === "granted";
}

/** 기기의 캘린더 목록 [{id, title, color}]. */
export async function listDeviceCalendars() {
  if (!isDeviceCalendarAvailable()) {
    return [];
  }
  const granted = await ensureCalendarPermission();
  if (!granted) {
    return [];
  }
  const { result } = await CapacitorCalendar.listCalendars();
  return (result || []).map((c) => ({
    id: c.id,
    title: c.title || "기기 캘린더",
    color: normalizeHex(c.color),
  }));
}

export function getSelectedCalendarIds() {
  try {
    return JSON.parse(localStorage.getItem(SELECTED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function setSelectedCalendarIds(ids) {
  localStorage.setItem(SELECTED_KEY, JSON.stringify(ids || []));
}

/**
 * 선택한 캘린더의 일정을 [from, to] 범위에서 읽어 백엔드로 업로드.
 * 반환: { upserted, hidden } 또는 동기화를 못 하면 null.
 */
export async function syncDeviceCalendar(from, to) {
  if (!isDeviceCalendarAvailable()) {
    return null;
  }
  const selected = getSelectedCalendarIds();
  if (selected.length === 0) {
    return null;
  }
  const granted = await ensureCalendarPermission();
  if (!granted) {
    return null;
  }

  const { result: allCalendars } = await CapacitorCalendar.listCalendars();
  const selectedSet = new Set(selected);
  const calendars = (allCalendars || [])
    .filter((c) => selectedSet.has(c.id))
    .map((c) => ({
      externalCalendarId: c.id,
      name: c.title || "기기 캘린더",
      colorHex: normalizeHex(c.color),
    }));
  if (calendars.length === 0) {
    return null;
  }

  const { result: rawEvents } = await CapacitorCalendar.listEventsInRange({
    from: from.getTime(),
    to: to.getTime(),
  });
  const events = (rawEvents || [])
    .filter((e) => e.calendarId && selectedSet.has(e.calendarId))
    .map((e) => ({
      externalEventId: e.id,
      externalCalendarId: e.calendarId,
      title: (e.title || "(제목 없음)").slice(0, 50),
      content: e.description ? e.description.slice(0, 200) : null,
      allDay: !!e.isAllDay,
      startAt: toLocalIso(e.startDate),
      endAt: toLocalIso(e.endDate),
      alertOption: mapAlert(e.alerts),
    }));

  return uploadDeviceCalendar({
    calendars,
    events,
    rangeStart: toLocalIso(from.getTime()),
    rangeEnd: toLocalIso(to.getTime()),
  });
}

// --- helpers ---

/** 기기 색상값을 백엔드용 #RRGGBB(7자)로 정규화. 실패 시 회색. */
function normalizeHex(color) {
  if (typeof color === "string" && /^#?[0-9a-fA-F]{6,8}$/.test(color.replace("#", ""))) {
    const hex = color.replace("#", "");
    return `#${hex.slice(0, 6)}`.toUpperCase();
  }
  return "#E5E7EB";
}

/** ms 타임스탬프 → 로컬 벽시계 ISO(타임존 없이), 백엔드 LocalDateTime용. */
function toLocalIso(ms) {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** 기기 알림(분 전 배열) → 우리 AlertOption. */
function mapAlert(alerts) {
  if (!alerts || alerts.length === 0) {
    return "NONE";
  }
  const m = alerts[0];
  if (m <= 0) return "AT_TIME";
  if (m <= 10) return "TEN_MINUTES_BEFORE";
  if (m <= 60) return "ONE_HOUR_BEFORE";
  return "ONE_DAY_BEFORE";
}
