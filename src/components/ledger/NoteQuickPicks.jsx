import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Nút chọn nhanh nội dung: gợi ý theo những nội dung đã nhập nhiều nhất,
// ưu tiên nội dung cùng nhóm và cùng loại (tiền vào / tiền ra) với ô đang điền.
export default function NoteQuickPicks({ entityName, type, groupId, onPick, max = 6 }) {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const rows = await base44.entities[entityName].list("-created_date", 300);
      if (!alive) return;
      const score = new Map();
      rows
        .filter((r) => !r.deleted_at && r.type === type)
        .forEach((r) => {
          const note = String(r.note || "").trim();
          if (!note) return;
          const sameGroup = groupId && r.group_id === groupId ? 3 : 1;
          score.set(note, (score.get(note) || 0) + sameGroup);
        });
      setNotes(
        Array.from(score.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, max)
          .map(([note]) => note)
      );
    })();
    return () => {
      alive = false;
    };
  }, [entityName, type, groupId, max]);

  if (notes.length === 0) return null;

  return (
    <div className="mt-2">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
        Nội dung hay dùng
      </p>
      <div className="flex flex-wrap gap-1.5">
        {notes.map((note) => (
          <button
            key={note}
            type="button"
            onClick={() => onPick(note)}
            className="max-w-full truncate rounded-full border border-[#CBD5E6] bg-[#F1F5F9] px-2.5 py-1 text-[12px] font-semibold text-[#475569] transition hover:border-[#2563EB]/40 hover:bg-[#E1E8F2] hover:text-[#0F172A]"
            title={note}
          >
            {note}
          </button>
        ))}
      </div>
    </div>
  );
}