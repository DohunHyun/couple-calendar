export default function BottomSheet({ open, title, onClose, children, zIndex = 40 }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0" style={{ zIndex }}>
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-black/10"
        onClick={onClose}
      />
      <section className="absolute bottom-0 left-0 right-0 rounded-t-[28px] bg-white px-5 pb-8 pt-4 shadow-sheet animate-rise">
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-zinc-200" />
        {title ? <h3 className="mb-4 text-lg font-semibold text-ink">{title}</h3> : null}
        {children}
      </section>
    </div>
  );
}
