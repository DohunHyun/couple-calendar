import { useEffect, useState } from "react";
import BottomSheet from "./BottomSheet";
import ColorChipPicker from "./ColorChipPicker";

export default function CategoryEditorSheet({ open, onClose, onSubmit, categories }) {
  const [form, setForm] = useState({
    id: null,
    name: "",
    colorHex: "#FBCFE8",
    type: "PRIVATE",
  });

  useEffect(() => {
    if (open) {
      setForm({
        id: null,
        name: "",
        colorHex: "#FBCFE8",
        type: "PRIVATE",
      });
    }
  }, [open]);

  return (
    <BottomSheet open={open} title="카테고리 관리" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
      >
        {categories.length ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-500">기존 카테고리</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setForm({ ...category })}
                  className="rounded-full px-3 py-2 text-sm"
                  style={{ backgroundColor: category.colorHex }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <input
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          className="w-full rounded-2xl border border-line px-4 py-3"
          maxLength={30}
          placeholder="카테고리명"
        />
        <ColorChipPicker value={form.colorHex} onChange={(colorHex) => setForm((prev) => ({ ...prev, colorHex }))} />
        <div className="grid grid-cols-2 gap-3">
          {["PRIVATE", "SHARED"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, type }))}
              className={`rounded-2xl px-4 py-3 font-medium ${
                form.type === type ? "bg-black text-white" : "bg-mist text-zinc-600"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <button type="submit" className="w-full rounded-2xl bg-black px-4 py-3 font-semibold text-white">
          {form.id ? "수정 저장" : "새 카테고리 저장"}
        </button>
      </form>
    </BottomSheet>
  );
}
