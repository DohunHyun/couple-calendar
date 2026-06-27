import { useEffect, useMemo, useRef, useState } from "react";

const ITEM_HEIGHT = 48;
const PICKER_HEIGHT = 204;
const EDGE_PADDING = 78;

function WheelColumn({ items, selectedValue, onSelect, formatItem }) {
  const ref = useRef(null);

  useEffect(() => {
    const index = items.findIndex((item) => item === selectedValue);
    if (index >= 0 && ref.current) {
      ref.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: "instant",
      });
    }
  }, [items, selectedValue]);

  return (
    <div className="relative z-[1] flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-16 bg-gradient-to-b from-white via-white/94 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 bg-gradient-to-t from-white via-white/94 to-transparent" />
      <div
        ref={ref}
        className="scrollbar-hidden relative z-[2] snap-y snap-mandatory overflow-y-auto"
        style={{ height: PICKER_HEIGHT }}
        onScroll={(event) => {
          const index = Math.round(event.currentTarget.scrollTop / ITEM_HEIGHT);
          const next = items[Math.max(0, Math.min(index, items.length - 1))];
          if (next !== undefined && next !== selectedValue) {
            onSelect(next);
          }
        }}
      >
        <div style={{ height: EDGE_PADDING }} />
        {items.map((item) => {
          const active = item === selectedValue;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={`flex w-full snap-center items-center justify-center text-center transition-all duration-150 ${
                active
                  ? "relative z-[3] text-[34px] font-extrabold text-black opacity-100"
                  : "text-[28px] font-semibold text-[#C9CBD1]"
              }`}
              style={{ height: ITEM_HEIGHT }}
            >
              {formatItem(item)}
            </button>
          );
        })}
        <div style={{ height: EDGE_PADDING }} />
      </div>
    </div>
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function MonthPickerSheet({
  visible,
  currentDate,
  anchorRect,
  onCancel,
  onConfirm,
}) {
  const baseDate = currentDate || new Date();
  const [tempYear, setTempYear] = useState(baseDate.getFullYear());
  const [tempMonth, setTempMonth] = useState(baseDate.getMonth() + 1);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (visible) {
      setTempYear(baseDate.getFullYear());
      setTempMonth(baseDate.getMonth() + 1);
      requestAnimationFrame(() => setEntered(true));
    } else {
      setEntered(false);
    }
  }, [visible, baseDate]);

  const years = useMemo(() => {
    const center = baseDate.getFullYear();
    return Array.from({ length: 21 }, (_, index) => center - 10 + index);
  }, [baseDate]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);

  if (!visible) {
    return null;
  }

  const viewportWidth = window.innerWidth;
  const horizontalMargin = 16;
  const width = viewportWidth - horizontalMargin * 2;
  const left = clamp(anchorRect.left, horizontalMargin, viewportWidth - horizontalMargin - width);
  const top = anchorRect.bottom + 10;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-black/25"
        onClick={onCancel}
      />

      <section
        className="absolute rounded-[30px] bg-white px-5 pb-3 pt-5 shadow-[0_8px_24px_rgba(0,0,0,0.16)] transition-all duration-200"
        style={{
          left,
          top,
          width,
          opacity: entered ? 1 : 0,
          transform: entered ? "translateY(0)" : "translateY(-10px)",
        }}
      >
        <div className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 text-[24px] font-bold text-[#111111]">
            <span>{tempYear}년 {tempMonth}월</span>
            <span className="text-xs text-zinc-400">▲</span>
          </div>
        </div>

        <div className="relative isolate mb-4">
          <div
            pointerEvents="none"
            className="pointer-events-none absolute left-0 right-0 top-1/2 z-0 h-[48px] -translate-y-1/2 rounded-2xl"
            style={{ backgroundColor: "rgba(245, 246, 248, 0.75)" }}
          />
          <div className="relative z-[1] flex gap-2">
            <WheelColumn
              items={years}
              selectedValue={tempYear}
              onSelect={setTempYear}
              formatItem={(year) => `${year}년`}
            />
            <WheelColumn
              items={months}
              selectedValue={tempMonth}
              onSelect={setTempMonth}
              formatItem={(month) => `${String(month).padStart(2, "0")}월`}
            />
          </div>
        </div>

        <div
          className="grid grid-cols-[1fr_auto_1fr] items-center"
          style={{ minHeight: 60 }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="py-3 text-center text-[19px] font-bold text-[#111111]"
          >
            취소
          </button>
          <div className="h-6 w-px bg-[#E5E5EA]" />
          <button
            type="button"
            onClick={() => onConfirm(tempYear, tempMonth)}
            className="py-3 text-center text-[19px] font-bold text-[#111111]"
          >
            완료
          </button>
        </div>
      </section>
    </div>
  );
}
