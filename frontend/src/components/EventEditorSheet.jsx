import { useEffect, useState } from "react";
import SelectionSheet from "./SelectionSheet";
import { toIsoDate } from "../utils/date";

const initialForm = {
  title: "",
  content: "",
  allDay: true,
  startDate: "",
  endDate: "",
  startTime: "09:00",
  endTime: "10:00",
  categoryId: "",
  alertOption: "NONE",
};

const alertOptions = [
  { value: "NONE", label: "등록 안 함" },
  { value: "AT_TIME", label: "일정 시간" },
  { value: "TEN_MINUTES_BEFORE", label: "10분 전" },
  { value: "ONE_HOUR_BEFORE", label: "1시간 전" },
  { value: "ONE_DAY_BEFORE", label: "1일 전" },
];

export default function EventEditorSheet({
  open,
  onClose,
  categories,
  selectedDate,
  event,
  onSubmit,
  onDelete,
}) {
  const [form, setForm] = useState(initialForm);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [alertDropdownOpen, setAlertDropdownOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const dateText = toIsoDate(selectedDate);
    setForm(
      event
        ? {
            title: event.title,
            content: event.content || "",
            allDay: event.allDay,
            startDate: event.startAt.slice(0, 10),
            endDate: event.endAt.slice(0, 10),
            startTime: event.startAt.slice(11, 16),
            endTime: event.endAt.slice(11, 16),
            categoryId: String(event.categoryId),
            alertOption: event.alertOption || "NONE",
          }
        : {
            ...initialForm,
            startDate: dateText,
            endDate: dateText,
            categoryId: categories[0] ? String(categories[0].id) : "",
          }
    );
    setCategoryDropdownOpen(false);
    setAlertDropdownOpen(false);
  }, [open, event, selectedDate, categories]);

  if (!open) {
    return null;
  }

  const selectedCategory = categories.find((category) => String(category.id) === form.categoryId);
  const selectedAlert = alertOptions.find((option) => option.value === form.alertOption);
  const categoryOptions = categories.map((category) => ({
    value: String(category.id),
    label: `${category.name} · ${category.type}`,
  }));

  return (
    <>
    <div className="fixed inset-0 z-50 bg-white">
      <div className="mx-auto flex h-full w-full max-w-md flex-col bg-white">
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <button type="button" onClick={onClose} className="text-xl font-bold text-zinc-700">
            ✕
          </button>
          <h2 className="text-lg font-bold text-ink">{event ? "일정 수정" : "일정 등록"}</h2>
          <button
            type="button"
            onClick={() => onSubmit(form)}
            className="font-bold text-blue-600"
          >
            저장
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-500">제목</label>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value.slice(0, 50) }))}
              placeholder="일정 제목"
              className="w-full rounded-2xl border border-line px-4 py-3 outline-none"
              maxLength={50}
            />
            <p className="mt-1 text-right text-xs text-zinc-400">{form.title.length}/50</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-500">카테고리</label>
            <button
              type="button"
              disabled={categoryOptions.length === 0}
              onClick={() => {
                setCategoryDropdownOpen(true);
                setAlertDropdownOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-line bg-white px-4 py-3 text-left shadow-[0_2px_6px_rgba(15,23,42,0.03)] disabled:bg-zinc-50 disabled:text-zinc-400"
            >
              <span className="truncate">
                {selectedCategory
                  ? `${selectedCategory.name} · ${selectedCategory.type}`
                  : categoryOptions.length === 0
                    ? "선택 가능한 카테고리가 없습니다."
                    : "카테고리 선택"}
              </span>
              <span className="text-zinc-400">⌄</span>
            </button>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-mist px-4 py-3">
            <span className="font-medium text-ink">종일</span>
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => setForm((prev) => ({ ...prev, allDay: e.target.checked }))}
              className="h-5 w-5"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              className="rounded-2xl border border-line px-4 py-3"
            />
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              className="rounded-2xl border border-line px-4 py-3"
            />
          </div>

          {!form.allDay ? (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                className="rounded-2xl border border-line px-4 py-3"
              />
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                className="rounded-2xl border border-line px-4 py-3"
              />
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-500">알림</label>
            <button
              type="button"
              onClick={() => {
                setAlertDropdownOpen(true);
                setCategoryDropdownOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-line bg-white px-4 py-3 text-left shadow-[0_2px_6px_rgba(15,23,42,0.03)]"
            >
              <span>{selectedAlert?.label || "알림 선택"}</span>
              <span className="text-zinc-400">⌄</span>
            </button>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-500">메모</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value.slice(0, 200) }))}
              placeholder="메모"
              className="min-h-28 w-full rounded-2xl border border-line px-4 py-3 outline-none"
              maxLength={200}
            />
            <p className="mt-1 text-right text-xs text-zinc-400">{form.content.length}/200</p>
          </div>
        </div>

        {event ? (
          <div className="border-t border-line px-4 py-4">
            <button
              type="button"
              onClick={() => onDelete(event)}
              className="w-full rounded-2xl border border-red-200 px-4 py-3 font-semibold text-red-500"
            >
              삭제
            </button>
          </div>
        ) : null}
      </div>
    </div>
    <SelectionSheet
      open={categoryDropdownOpen}
      title="카테고리 선택"
      options={categoryOptions}
      value={form.categoryId}
      onClose={() => setCategoryDropdownOpen(false)}
      onSelect={(value) => setForm((prev) => ({ ...prev, categoryId: value }))}
      zIndex={80}
    />
    <SelectionSheet
      open={alertDropdownOpen}
      title="알림 시점"
      options={alertOptions}
      value={form.alertOption}
      onClose={() => setAlertDropdownOpen(false)}
      onSelect={(value) => setForm((prev) => ({ ...prev, alertOption: value }))}
      zIndex={80}
    />
    </>
  );
}
