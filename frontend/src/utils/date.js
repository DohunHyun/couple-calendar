export function monthMatrix(baseDate) {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  const firstDay = new Date(start);
  firstDay.setDate(start.getDate() - start.getDay());
  const lastDay = new Date(end);
  lastDay.setDate(end.getDate() + (6 - end.getDay()));
  const days = [];
  for (let cursor = new Date(firstDay); cursor <= lastDay; cursor.setDate(cursor.getDate() + 1)) {
    days.push(new Date(cursor));
  }
  const weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}

export function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function sameDate(left, right) {
  return toIsoDate(left) === toIsoDate(right);
}

export function formatInviteCode(value) {
  const normalized = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8);
  if (normalized.length <= 4) {
    return normalized;
  }
  return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
}

export function cleanInviteCode(value) {
  return value.replace(/-/g, "").toUpperCase();
}

export function daysSince(dateText) {
  if (!dateText) {
    return null;
  }
  const target = new Date(dateText);
  const today = new Date();
  const diff = Math.floor((today.setHours(0, 0, 0, 0) - target.setHours(0, 0, 0, 0)) / 86400000);
  return diff >= 0 ? diff + 1 : null;
}

export function formatMonthTitle(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

export function eventOccursOnDate(event, date) {
  const day = toIsoDate(date);
  return event.startAt.slice(0, 10) <= day && event.endAt.slice(0, 10) >= day;
}
