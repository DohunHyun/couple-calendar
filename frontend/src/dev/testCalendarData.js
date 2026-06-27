const importMetaEnv = typeof import.meta !== "undefined" ? import.meta.env : undefined;

export const DEV_TEST_ENABLED = Boolean(importMetaEnv?.DEV);

export const TEST_GROUP_ID = "test-shared-group-1";
export const DEV_SESSION_STORAGE_KEY = "devTestSession";
export const DEV_EVENTS_STORAGE_KEY = "devTestEvents";

export const TEST_USERS = {
  A: {
    id: "test-user-a",
    userId: "test-user-a",
    email: "nahyeon@test.local",
    name: "나현",
    nickname: "나현",
    displayName: "나현",
    provider: "TEST",
    coupleId: TEST_GROUP_ID,
    groupId: TEST_GROUP_ID,
    anniversaryDate: "2025-08-10",
    partnerNickname: "도훈",
    profileCompleted: true,
  },
  B: {
    id: "test-user-b",
    userId: "test-user-b",
    email: "dohun@test.local",
    name: "도훈",
    nickname: "도훈",
    displayName: "도훈",
    provider: "TEST",
    coupleId: TEST_GROUP_ID,
    groupId: TEST_GROUP_ID,
    anniversaryDate: "2025-08-10",
    partnerNickname: "나현",
    profileCompleted: true,
  },
};

const baseCategories = [
  {
    id: "test-category-shared",
    name: "함께 일정",
    colorHex: "#F6BBD8",
    type: "SHARED",
    ownerUserId: "test-user-a",
    ownerNickname: "나현",
  },
  {
    id: "test-category-private-a",
    name: "나만 일정",
    colorHex: "#FFE3A3",
    type: "PRIVATE",
    ownerUserId: "test-user-a",
    ownerNickname: "나현",
  },
  {
    id: "test-category-private-b",
    name: "나만 일정",
    colorHex: "#D9D4FF",
    type: "PRIVATE",
    ownerUserId: "test-user-b",
    ownerNickname: "도훈",
  },
];

export const DEFAULT_TEST_EVENTS = [
  {
    id: "event-shared-001",
    title: "둘이 저녁 약속",
    content: "",
    allDay: false,
    startAt: "2026-06-21T19:00:00",
    endAt: "2026-06-21T21:00:00",
    categoryId: "test-category-shared",
    categoryName: "함께 일정",
    categoryType: "SHARED",
    visibility: "shared",
    ownerId: "test-user-a",
    ownerNickname: "나현",
    groupId: TEST_GROUP_ID,
    colorHex: "#F6BBD8",
    sourceType: "LOCAL",
    alertOption: "AT_TIME",
  },
  {
    id: "event-shared-002",
    title: "주말 데이트",
    content: "",
    allDay: false,
    startAt: "2026-06-27T14:00:00",
    endAt: "2026-06-27T18:00:00",
    categoryId: "test-category-shared",
    categoryName: "함께 일정",
    categoryType: "SHARED",
    visibility: "shared",
    ownerId: "test-user-b",
    ownerNickname: "도훈",
    groupId: TEST_GROUP_ID,
    colorHex: "#BFDFFF",
    sourceType: "LOCAL",
    alertOption: "AT_TIME",
  },
  {
    id: "event-private-a-001",
    title: "나현 개인 일정",
    content: "",
    allDay: false,
    startAt: "2026-06-23T10:00:00",
    endAt: "2026-06-23T11:00:00",
    categoryId: "test-category-private-a",
    categoryName: "나만 일정",
    categoryType: "PRIVATE",
    visibility: "private",
    ownerId: "test-user-a",
    ownerNickname: "나현",
    groupId: TEST_GROUP_ID,
    colorHex: "#FFE3A3",
    sourceType: "LOCAL",
    alertOption: "AT_TIME",
  },
  {
    id: "event-private-a-002",
    title: "나현 병원 예약",
    content: "",
    allDay: false,
    startAt: "2026-06-25T14:00:00",
    endAt: "2026-06-25T15:00:00",
    categoryId: "test-category-private-a",
    categoryName: "나만 일정",
    categoryType: "PRIVATE",
    visibility: "private",
    ownerId: "test-user-a",
    ownerNickname: "나현",
    groupId: TEST_GROUP_ID,
    colorHex: "#FFD0D0",
    sourceType: "LOCAL",
    alertOption: "ONE_HOUR_BEFORE",
  },
  {
    id: "event-private-b-001",
    title: "도훈 개인 일정",
    content: "",
    allDay: false,
    startAt: "2026-06-24T09:00:00",
    endAt: "2026-06-24T10:00:00",
    categoryId: "test-category-private-b",
    categoryName: "나만 일정",
    categoryType: "PRIVATE",
    visibility: "private",
    ownerId: "test-user-b",
    ownerNickname: "도훈",
    groupId: TEST_GROUP_ID,
    colorHex: "#D9D4FF",
    sourceType: "LOCAL",
    alertOption: "AT_TIME",
  },
  {
    id: "event-private-b-002",
    title: "도훈 운동",
    content: "",
    allDay: false,
    startAt: "2026-06-29T20:00:00",
    endAt: "2026-06-29T21:00:00",
    categoryId: "test-category-private-b",
    categoryName: "나만 일정",
    categoryType: "PRIVATE",
    visibility: "private",
    ownerId: "test-user-b",
    ownerNickname: "도훈",
    groupId: TEST_GROUP_ID,
    colorHex: "#C7F2D4",
    sourceType: "LOCAL",
    alertOption: "AT_TIME",
  },
  {
    id: "event-shared-multiday-001",
    title: "샌다이",
    content: "",
    allDay: true,
    startAt: "2026-07-17T00:00:00",
    endAt: "2026-07-20T00:00:00",
    categoryId: "test-category-shared",
    categoryName: "함께 일정",
    categoryType: "SHARED",
    visibility: "shared",
    ownerId: "test-user-a",
    ownerNickname: "나현",
    groupId: TEST_GROUP_ID,
    colorHex: "#F6BBD8",
    sourceType: "LOCAL",
    alertOption: "NONE",
  },
  {
    id: "event-private-a-multiday-001",
    title: "나현 개인 여행",
    content: "",
    allDay: true,
    startAt: "2026-07-27T00:00:00",
    endAt: "2026-07-31T00:00:00",
    categoryId: "test-category-private-a",
    categoryName: "나만 일정",
    categoryType: "PRIVATE",
    visibility: "private",
    ownerId: "test-user-a",
    ownerNickname: "나현",
    groupId: TEST_GROUP_ID,
    colorHex: "#FFE3A3",
    sourceType: "LOCAL",
    alertOption: "NONE",
  },
  {
    id: "event-private-b-multiday-001",
    title: "도훈 출장",
    content: "",
    allDay: true,
    startAt: "2026-07-13T00:00:00",
    endAt: "2026-07-15T00:00:00",
    categoryId: "test-category-private-b",
    categoryName: "나만 일정",
    categoryType: "PRIVATE",
    visibility: "private",
    ownerId: "test-user-b",
    ownerNickname: "도훈",
    groupId: TEST_GROUP_ID,
    colorHex: "#BFDFFF",
    sourceType: "LOCAL",
    alertOption: "NONE",
  },
  {
    id: "event-other-group-001",
    title: "다른 그룹 일정 - 보이면 안 됨",
    content: "",
    allDay: false,
    startAt: "2026-06-22T12:00:00",
    endAt: "2026-06-22T13:00:00",
    categoryId: "other-category-shared",
    categoryName: "다른 그룹",
    categoryType: "SHARED",
    visibility: "shared",
    ownerId: "other-user-1",
    ownerNickname: "다른 사용자",
    groupId: "other-group",
    colorHex: "#CCCCCC",
    sourceType: "LOCAL",
    alertOption: "NONE",
  },
];

function safeReadJson(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key, value) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function buildTestSession(userKey) {
  const user = TEST_USERS[userKey];
  if (!user) {
    return null;
  }
  return {
    ...user,
    devTestUserKey: userKey,
  };
}

export function saveDevTestSession(userKey) {
  safeWriteJson(DEV_SESSION_STORAGE_KEY, { userKey });
}

export function loadDevTestSession() {
  const stored = safeReadJson(DEV_SESSION_STORAGE_KEY, null);
  return stored?.userKey ? buildTestSession(stored.userKey) : null;
}

export function clearDevTestSession() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(DEV_SESSION_STORAGE_KEY);
}

export function loadTestEvents() {
  return safeReadJson(DEV_EVENTS_STORAGE_KEY, DEFAULT_TEST_EVENTS);
}

export function saveTestEvents(events) {
  safeWriteJson(DEV_EVENTS_STORAGE_KEY, events);
}

export function ensureTestEvents() {
  if (typeof window === "undefined") {
    return DEFAULT_TEST_EVENTS;
  }
  const stored = window.localStorage.getItem(DEV_EVENTS_STORAGE_KEY);
  if (!stored) {
    saveTestEvents(DEFAULT_TEST_EVENTS);
    return DEFAULT_TEST_EVENTS;
  }
  return loadTestEvents();
}

export function resetTestEvents() {
  saveTestEvents(DEFAULT_TEST_EVENTS);
  return DEFAULT_TEST_EVENTS;
}

export function getTestCategoriesForUser(user) {
  const userId = user?.userId || user?.id;
  return baseCategories.filter((category) => category.type === "SHARED" || category.ownerUserId === userId);
}
