import { PASTEL_COLORS } from "../utils/constants";

export default function ColorChipPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-6 gap-3">
      {PASTEL_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`h-10 w-10 rounded-full border-2 transition ${
            value === color ? "border-black scale-105" : "border-transparent"
          }`}
          style={{ backgroundColor: color }}
          aria-label={color}
        />
      ))}
    </div>
  );
}
