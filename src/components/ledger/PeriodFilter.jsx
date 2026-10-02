import React from "react";
import { Input } from "@/components/ui/input";
import { Layers, CalendarDays, CalendarRange } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);

const MODES = [
  { id: "all", label: "Tất cả", Icon: Layers },
  { id: "day", label: "Theo ngày", Icon: CalendarDays },
  { id: "month", label: "Theo tháng", Icon: CalendarRange },
];

const fmtDay = (v) => (v ? new Date(v).toLocaleDateString("vi-VN") : "—");
const fmtMonth = (v) => (v ? `${v.slice(5, 7)}/${v.slice(0, 4)}` : "—");

export default function PeriodFilter({ period, onChange }) {
  const setMode = (mode) => {
    if (mode === "all") return onChange({ mode, from: "", to: "" });
    const def = mode === "day" ? today() : thisMonth();
    onChange({ mode, from: def, to: def });
  };

  const label =
    period.mode === "all"
      ? "Toàn bộ thời gian"
      : period.mode === "day"
      ? `${fmtDay(period.from)} → ${fmtDay(period.to)}`
      : `${fmtMonth(period.from)} → ${fmtMonth(period.to)}`;

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-[#C9D5E6] bg-white p-2 shadow-sm">
      <div className="flex items-center gap-1 rounded-lg border border-[#C9D5E6] bg-[#E1E8F2] p-1">
        {MODES.map(({ id, label: text, Icon }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              period.mode === id ? "bg-[#1D4ED8] text-white shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <Icon size={13} /> {text}
          </button>
        ))}
      </div>

      {period.mode !== "all" && (
        <div className="flex items-center gap-2">
          <Input
            type={period.mode === "day" ? "date" : "month"}
            value={period.from}
            onChange={(e) => onChange({ ...period, from: e.target.value })}
            className="w-[150px] bg-white border-[#CBD5E6] text-[#0F172A] rounded-lg font-mono text-[13px]"
          />
          <span className="text-xs text-[#94A3B8]">→</span>
          <Input
            type={period.mode === "day" ? "date" : "month"}
            value={period.to}
            onChange={(e) => onChange({ ...period, to: e.target.value })}
            className="w-[150px] bg-white border-[#CBD5E6] text-[#0F172A] rounded-lg font-mono text-[13px]"
          />
        </div>
      )}

      <span className="ml-auto pr-2 font-mono text-[12px] tabular-nums text-[#64748B]">{label}</span>
    </div>
  );
}