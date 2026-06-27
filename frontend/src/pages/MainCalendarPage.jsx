import { useEffect, useMemo, useRef, useState } from "react";
import { fetchCategories } from "../api/categories";
import { deleteEvent, fetchEvents, saveEvent } from "../api/events";
import CalendarGrid from "../components/CalendarGrid";
import EventEditorSheet from "../components/EventEditorSheet";
import EventListSheet from "../components/EventListSheet";
import EventSearchModal from "../components/EventSearchModal";
import MonthSelectorCarousel from "../components/MonthSelectorCarousel";
import {
  getTestCategoriesForUser,
  loadTestEvents,
  saveTestEvents,
  TEST_GROUP_ID,
} from "../dev/testCalendarData";
import { daysSince, eventOccursOnDate, formatMonthTitle, toIsoDate } from "../utils/date";
import { getEventVisibility, getVisibleEventsForUser } from "../utils/eventVisibility";

const previewCategories = [
  { id: 1, name: "데이트", colorHex: "#FBCFE8", type: "SHARED", ownerUserId: 1, ownerNickname: "나현" },
  { id: 2, name: "병원", colorHex: "#BFDBFE", type: "PRIVATE", ownerUserId: 2, ownerNickname: "도훈" },
  { id: 3, name: "구글 일정", colorHex: "#E5E7EB", type: "SHARED", ownerUserId: 1, ownerNickname: "나현" },
];

const previewEvents = [
  {
    id: 101,
    title: "한강 데이트",
    content: "저녁 7시 반포",
    allDay: false,
    startAt: "2026-06-21T19:00:00",
    endAt: "2026-06-21T21:00:00",
    categoryId: 1,
    categoryName: "데이트",
    colorHex: "#FBCFE8",
    categoryType: "SHARED",
    ownerId: 1,
    ownerNickname: "나현",
    hidden: false,
    sourceType: "LOCAL",
    alertOption: "AT_TIME",
  },
  {
    id: 102,
    title: "100일 기념",
    content: "",
    allDay: true,
    startAt: "2026-06-23T00:00:00",
    endAt: "2026-06-23T00:00:00",
    categoryId: 1,
    categoryName: "데이트",
    colorHex: "#FBCFE8",
    categoryType: "SHARED",
    ownerId: 2,
    ownerNickname: "도훈",
    hidden: false,
    sourceType: "LOCAL",
    alertOption: "NONE",
  },
  {
    id: 103,
    title: "치과 검진",
    content: "",
    allDay: false,
    startAt: "2026-06-25T14:00:00",
    endAt: "2026-06-25T15:00:00",
    categoryId: 2,
    categoryName: "병원",
    colorHex: "#BFDBFE",
    categoryType: "PRIVATE",
    ownerId: 2,
    ownerNickname: "도훈",
    hidden: false,
    sourceType: "LOCAL",
    alertOption: "ONE_HOUR_BEFORE",
  },
  {
    id: 104,
    title: "현충일",
    content: "",
    allDay: true,
    startAt: "2026-06-06T00:00:00",
    endAt: "2026-06-06T00:00:00",
    categoryId: 3,
    categoryName: "구글 일정",
    colorHex: "#E5E7EB",
    categoryType: "SHARED",
    ownerId: 1,
    ownerNickname: "나현",
    hidden: false,
    sourceType: "GOOGLE_HOLIDAY",
    alertOption: "NONE",
  },
];

const visibilityFilters = [
  { value: "all", label: "전체" },
  { value: "shared", label: "Shared" },
  { value: "private", label: "Private" },
];

export default function MainCalendarPage({
  user,
  settings,
  onOpenSettings,
  previewMode = false,
  devTestMode = false,
  refreshSeed = 0,
}) {
  const [baseDate, setBaseDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [searchEvents, setSearchEvents] = useState([]);
  const [holidayDates, setHolidayDates] = useState(new Set());
  const [categories, setCategories] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [monthSelectorOpen, setMonthSelectorOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [monthAnchorRect, setMonthAnchorRect] = useState({ left: 16, bottom: 88 });
  const monthButtonRef = useRef(null);

  async function loadCalendar(targetDate = baseDate, syncGoogle = false) {
    if (previewMode) {
      setEvents(previewEvents);
      setCategories(previewCategories);
      setHolidayDates(new Set(["2026-06-06"]));
      return;
    }
    if (devTestMode) {
      setEvents(loadTestEvents());
      setCategories(getTestCategoriesForUser(user));
      setHolidayDates(new Set());
      return;
    }
    const monthStart = toIsoDate(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1));
    const monthEnd = toIsoDate(new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0));
    const [calendarData, categoryData] = await Promise.all([
      fetchEvents(monthStart, monthEnd, syncGoogle),
      fetchCategories(),
    ]);
    setEvents(calendarData.events);
    setCategories(categoryData);
    setHolidayDates(new Set(calendarData.holidayDates || []));
  }

  useEffect(() => {
    loadCalendar(baseDate, true);
  }, [baseDate, refreshSeed]);

  const visibleEvents = useMemo(() => {
    const googleFiltered = settings.googleVisible
      ? events
      : events.filter((event) => event.sourceType !== "GOOGLE" && event.sourceType !== "GOOGLE_HOLIDAY");
    return getVisibleEventsForUser(googleFiltered, user, visibilityFilter);
  }, [events, settings.googleVisible, user, visibilityFilter]);

  const selectedEvents = visibleEvents.filter((event) => eventOccursOnDate(event, selectedDate));
  const dday = daysSince(user?.anniversaryDate);
  const isPreviewMode = previewMode && user?.provider === "PREVIEW" && !user?.email?.endsWith("@demo.local");
  const isDevTestMode = devTestMode && user?.provider === "TEST";

  async function handleSaveEvent(form) {
    if (previewMode || devTestMode) {
      const category = categories.find((item) => String(item.id) === String(form.categoryId));
      const visibility = getEventVisibility({ visibility: category?.type || "PRIVATE" });
      const nextEvent = {
        id: editingEvent?.id || Date.now(),
        title: form.title,
        content: form.content,
        allDay: form.allDay,
        startAt: `${form.startDate}T${form.allDay ? "00:00" : form.startTime}:00`,
        endAt: `${form.endDate}T${form.allDay ? "00:00" : form.endTime}:00`,
        categoryId: form.categoryId,
        categoryName: category?.name || "",
        colorHex: category?.colorHex || "#FBCFE8",
        categoryType: category?.type || "PRIVATE",
        visibility,
        ownerId: user?.userId || user?.id || 999,
        ownerNickname: user?.nickname || "나",
        groupId: user?.groupId || user?.coupleId || TEST_GROUP_ID,
        hidden: false,
        sourceType: "LOCAL",
        alertOption: form.alertOption,
      };
      setEvents((prev) => {
        const nextEvents = editingEvent
          ? prev.map((item) => (item.id === editingEvent.id ? nextEvent : item))
          : [...prev, nextEvent];
        if (devTestMode) {
          saveTestEvents(nextEvents);
        }
        return nextEvents;
      });
      setEditorOpen(false);
      setEditingEvent(null);
      return;
    }
    if (!form.title.trim()) {
      window.alert("제목을 입력해주세요.");
      return;
    }
    await saveEvent(
      {
        ...form,
        categoryId: Number(form.categoryId),
      },
      editingEvent?.id
    );
    setEditorOpen(false);
    setEditingEvent(null);
    loadCalendar();
  }

  async function handleDeleteEvent(event) {
    if (previewMode || devTestMode) {
      setEvents((prev) => {
        const nextEvents = prev.filter((item) => item.id !== event.id);
        if (devTestMode) {
          saveTestEvents(nextEvents);
        }
        return nextEvents;
      });
      setEditorOpen(false);
      setEditingEvent(null);
      return;
    }
    const result = await deleteEvent(event.id, false);
    if (result.confirmRequired) {
      const ok = window.confirm(result.message);
      if (!ok) {
        return;
      }
      await deleteEvent(event.id, true);
    }
    setEditorOpen(false);
    setEditingEvent(null);
    loadCalendar();
  }

  function measureMonthAnchor() {
    const rect = monthButtonRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    setMonthAnchorRect({
      left: 16,
      bottom: rect.bottom,
    });
  }

  useEffect(() => {
    if (!monthSelectorOpen) {
      return undefined;
    }
    measureMonthAnchor();
    const handleResize = () => measureMonthAnchor();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [monthSelectorOpen]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    if (previewMode) {
      setSearchEvents(previewEvents);
      return;
    }
    if (devTestMode) {
      setSearchEvents(getVisibleEventsForUser(loadTestEvents(), user, "all"));
      return;
    }

    const searchStart = toIsoDate(new Date(baseDate.getFullYear(), baseDate.getMonth() - 12, 1));
    const searchEnd = toIsoDate(new Date(baseDate.getFullYear(), baseDate.getMonth() + 13, 0));

    fetchEvents(searchStart, searchEnd, false)
      .then((data) => setSearchEvents(data.events || []))
      .catch(() => setSearchEvents([]));
  }, [searchOpen, previewMode, baseDate]);

  return (
    <main className="min-h-screen bg-white px-3 pb-24 pt-6">
      <section className="mx-auto w-full max-w-[30rem]">
        <header className="mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <button
                ref={monthButtonRef}
                type="button"
                onClick={() => {
                  if (monthSelectorOpen) {
                    setMonthSelectorOpen(false);
                    return;
                  }
                  measureMonthAnchor();
                  setMonthSelectorOpen(true);
                }}
                className="flex items-center gap-2 text-left text-[1.85rem] font-bold tracking-tight text-ink"
              >
                <span>{formatMonthTitle(baseDate)}</span>
                <span className="text-base text-zinc-400">⌄</span>
              </button>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="일정 검색"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F6F6F8] text-zinc-900"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20L17 17" strokeLinecap="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setBaseDate(new Date(today.getFullYear(), today.getMonth(), 1));
                  setSelectedDate(today);
                }}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700"
              >
                오늘
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
              >
                설정
              </button>
            </div>
          </div>
          {settings.ddayVisible ? (
            <div className="mt-4 rounded-[22px] border border-[#EFEDEF] bg-[#FAF7F7] px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7C7C86]">D-DAY</span>
                <p className="min-w-0 truncate text-[19px] font-bold text-zinc-900">
                  {user?.partnerNickname || "우리"} ❤ {user?.nickname || "나"} +{dday || 0}일
                </p>
              </div>
            </div>
          ) : null}
          {isPreviewMode ? (
            <p className="mt-3 text-[13px] leading-5 text-zinc-400">프리뷰 모드로 둘러보는 중입니다.</p>
          ) : null}
          {isDevTestMode ? (
            <p className="mt-3 text-[13px] leading-5 text-zinc-400">
              테스트 계정: {user?.nickname} · Shared는 함께 보이고 Private은 본인에게만 보입니다.
            </p>
          ) : null}
        </header>

        <div className="mb-3 flex flex-wrap gap-2">
          {visibilityFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setVisibilityFilter(filter.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                visibilityFilter === filter.value
                  ? "bg-black text-white"
                  : "bg-[#F5F6F8] text-zinc-600"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <CalendarGrid
          baseDate={baseDate}
          selectedDate={selectedDate}
          events={visibleEvents}
          holidayDates={holidayDates}
          onMonthChange={(direction) =>
            setBaseDate(new Date(baseDate.getFullYear(), baseDate.getMonth() + direction, 1))
          }
          onSelectDate={(date) => {
            setSelectedDate(date);
            setSheetOpen(true);
          }}
          onEventSelect={(event) => {
            setSelectedDate(new Date(event.startAt));
            setEditingEvent(event);
            setSheetOpen(false);
            setEditorOpen(true);
          }}
        />
        <p className="mt-3 px-1 text-[13px] leading-5 text-[#9CA0AA]">
          달력 영역을 좌우로 스와이프하거나 스크롤하면 월이 바뀝니다.
        </p>
      </section>

      <EventSearchModal
        open={searchOpen}
        events={previewMode ? previewEvents : devTestMode ? getVisibleEventsForUser(loadTestEvents(), user, "all") : searchEvents}
        onClose={() => setSearchOpen(false)}
        onSelectEvent={(event) => {
          const eventDate = new Date(event.startAt);
          setBaseDate(new Date(eventDate.getFullYear(), eventDate.getMonth(), 1));
          setSelectedDate(eventDate);
          setSearchOpen(false);
        }}
      />

      <EventListSheet
        open={sheetOpen}
        dateLabel={toIsoDate(selectedDate)}
        events={selectedEvents}
        onClose={() => setSheetOpen(false)}
        onCreate={() => {
          setEditingEvent(null);
          setSheetOpen(false);
          setEditorOpen(true);
        }}
        onEdit={(event) => {
          setEditingEvent(event);
          setSheetOpen(false);
          setEditorOpen(true);
        }}
      />

      <EventEditorSheet
        open={editorOpen}
        selectedDate={selectedDate}
        categories={categories}
        event={editingEvent}
        onClose={() => {
          setEditorOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />

      <MonthSelectorCarousel
        visible={monthSelectorOpen}
        currentDate={baseDate}
        anchorRect={monthAnchorRect}
        onClose={() => setMonthSelectorOpen(false)}
        onSelect={(date) => {
          setBaseDate(new Date(date.getFullYear(), date.getMonth(), 1));
          setMonthSelectorOpen(false);
        }}
      />
    </main>
  );
}
