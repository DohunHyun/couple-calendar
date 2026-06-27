import BottomSheet from "./BottomSheet";

export default function SelectionSheet({ open, title, options, value, onClose, onSelect, zIndex = 40 }) {
  return (
    <BottomSheet open={open} title={title} onClose={onClose} zIndex={zIndex}>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onSelect(option.value);
              onClose();
            }}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left ${
              value === option.value ? "bg-black text-white" : "bg-mist text-zinc-700"
            }`}
          >
            <span className="font-medium">{option.label}</span>
            {value === option.value ? <span className="text-sm">선택됨</span> : null}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
