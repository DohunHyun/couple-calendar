import { useEffect, useState } from "react";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

export default function MonthSelectorCarousel({
  visible,
  currentDate,
  anchorRect,
  onClose,
  onSelect,
}) {
  const activeDate = currentDate || new Date();
  const activeYear = activeDate.getFullYear();
  const activeMonth = activeDate.getMonth() + 1;
  const [displayYear, setDisplayYear] = useState(activeYear);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (visible) {
      setDisplayYear(activeYear);
      requestAnimationFrame(() => setEntered(true));
      return;
    }
    setEntered(false);
  }, [visible, activeYear]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  if (!visible) {
    return null;
  }

  const viewportWidth = window.innerWidth;
  const horizontalMargin = 16;
  const width = viewportWidth - horizontalMargin * 2;
  const left = clamp(anchorRect?.left ?? horizontalMargin, horizontalMargin, viewportWidth - horizontalMargin - width);
  const top = (anchorRect?.bottom || 72) + 10;
  const canGoPrev = displayYear > activeYear - 10;
  const canGoNext = displayYear < activeYear + 10;

  return (
    <div className="fixed inset-0 z-[70]">
      <button type="button" aria-label="닫기" className="absolute inset-0 bg-black/20" onClick={onClose} />

      <section
        className="absolute rounded-[26px] bg-white px-5 pb-5 pt-5 shadow-[0_18px_36px_rgba(15,23,42,0.14)] transition-all duration-200"
        style={{
          left,
          top,
          width,
          opacity: entered ? 1 : 0,
          transform: entered ? "translateY(0)" : "translateY(-8px)",
        }}
      >
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => canGoPrev && setDisplayYear((year) => year - 1)}
            disabled={!canGoPrev}
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              canGoPrev ? "bg-[#F6F6F8] text-zinc-900" : "bg-[#F6F6F8] text-zinc-300"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18L9 12L15 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="text-center">
            <p className="text-[1.4rem] font-bold tracking-tight text-zinc-950">{displayYear}년</p>
          </div>

          <button
            type="button"
            onClick={() => canGoNext && setDisplayYear((year) => year + 1)}
            disabled={!canGoNext}
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              canGoNext ? "bg-[#F6F6F8] text-zinc-900" : "bg-[#F6F6F8] text-zinc-300"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18L15 12L9 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {MONTHS.map((month) => {
            const isSelected = displayYear === activeYear && month === activeMonth;
            return (
              <button
                key={month}
                type="button"
                onClick={() => onSelect(new Date(displayYear, month - 1, 1))}
                className={`h-12 rounded-[16px] border text-center text-[17px] font-semibold transition ${
                  isSelected
                    ? "border-black bg-black text-white"
                    : "border-[#E9E9EE] bg-[#FFFFFF] text-[#111111]"
                }`}
              >
                {month}월
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
